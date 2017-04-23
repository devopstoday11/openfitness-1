'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _base = require('base-64');

var _base2 = _interopRequireDefault(_base);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var today = (0, _moment2.default)().format('YYYY-MM-DD');

var FitBit = function () {
  /**
   * @constructor
   * @param {object} data
   */
  function FitBit(data) {
    _classCallCheck(this, FitBit);

    this.data = data;
  }

  /**
   * Constructs headers needed to send to api
   * @param {string} type Type of request (basic|bearer)
   */


  _createClass(FitBit, [{
    key: 'constructHeaders',
    value: function constructHeaders() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'bearer';

      var headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      if (type === 'basic') {
        headers.Authorization = 'Basic ' + _base2.default.encode(this.data.clientId + ':' + this.data.clientSecret);
      } else if (type === 'bearer') {
        headers.Authorization = 'Bearer ' + process.env.fitbitAccessToken;
      }
      return headers;
    }

    /**
     * Sends a request to FitBit API
     * @TODO resolve body with JSON.parse
     *
     * @param {string} method Type of request to send
     * @param {string} url URL to send request to
     * @param {object} headers Headers to go with request
     * @param {function} callback Callback function to run after request
     * @param {object} data Data to send with request
     * @param {boolean} auth If it is an authentication request
     * @return {Promise}
     */

  }, {
    key: 'sendRequest',
    value: function sendRequest() {
      var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'GET';
      var url = arguments[1];
      var headers = arguments[2];
      var data = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      var _this = this;

      var callback = arguments[4];
      var auth = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;

      return new Promise(function (fulfill, reject) {
        var callbackFn = void 0;
        if (!callback) {
          callbackFn = function callbackFn(err, response, body) {
            if (err || response.statusCode >= 400) {
              reject(err || body);
            } else {
              fulfill(body);
            }
          };
        } else {
          callbackFn = callback;
        }

        if (auth === false) {
          _this.refreshToken().then(function () {
            _request2.default.get({
              url: url,
              headers: headers,
              form: data
            }, callbackFn);
          });
        } else {
          _request2.default.post({
            url: url,
            headers: headers,
            form: data
          }, callbackFn);
        }
      });
    }

    /**
     * Generates an access token for FitBit
     *
     * @param {string} code Code returned from api
     * @return {Promise}
     */

  }, {
    key: 'authorize',
    value: function authorize(code) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.sendRequest('POST', 'https://api.fitbit.com/oauth2/token', _this2.constructHeaders('basic'), {
          client_id: _this2.data.clientId,
          grant_type: 'authorization_code',
          redirect_uri: _this2.data.callbackUrl,
          code: code
        }, function (err, res, body) {
          if (err || res.statusCode >= 400) {
            console.log(err);
            reject(err || body);
          } else {
            var output = JSON.parse(body);
            process.env.fitbitAccessToken = output.access_token;
            process.env.fitbitRefreshToken = output.refresh_token;
            console.log({
              refreshToken: process.env.fitbitRefreshToken,
              accessToken: process.env.fitbitAccessToken
            });
            resolve(output);
          }
        }, true);
      });
    }

    /**
     * Gets a new access token for FitBit
     *
     * @return {Promise}
     */

  }, {
    key: 'refreshToken',
    value: function refreshToken() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.sendRequest('POST', 'https://api.fitbit.com/oauth2/token', _this3.constructHeaders('basic'), {
          grant_type: 'refresh_token',
          refresh_token: process.env.fitbitRefreshToken
        }, function (err, res, body) {
          if (err || res.statusCode >= 400) {
            reject(err || body);
          } else {
            var output = JSON.parse(body);
            process.env.fitbitAccessToken = output.access_token;
            process.env.fitbitRefreshToken = output.refresh_token;
            console.log({
              refreshToken: process.env.fitbitRefreshToken,
              accessToken: process.env.fitbitAccessToken
            });
            resolve(output);
          }
        }, true);
      });
    }

    /**
     * Method for /activity endpoint
     * @source https://dev.fitbit.com/docs/activity/
     *
     * @param {string} endpoint Endpoint to hit
     * @param {string} date Date(s) requesting
     * @return {Promise}
     */

  }, {
    key: 'getActivity',
    value: function getActivity() {
      var endpoint = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'activities';
      var date = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : today;

      return this.sendRequest('GET', 'https://api.fitbit.com/1/user/-/' + endpoint + '/date/' + date + '.json', this.constructHeaders());
    }

    /**
     * Method for /sleep endpoint
     * @source https://dev.fitbit.com/docs/sleep/
     * @TODO addsupport sleep logs list
     *
     * @param {string} date Date(s) requesting
     * @return {Promise}
     */

  }, {
    key: 'getSleep',
    value: function getSleep() {
      var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : (0, _moment2.default)().subtract(1, 'days').format('YYYY-MM-DD');

      return this.sendRequest('GET', 'https://api.fitbit.com/1.2/user/-/sleep/date/' + date + '.json', this.constructHeaders());
    }

    /**
     * Method for /heart endpoint
     *
     * @param {string} date Date(s) requesting
     * @return {Promise}
     */

  }, {
    key: 'getHeartRate',
    value: function getHeartRate() {
      var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'today/1d';

      return this.sendRequest('GET', 'https://api.fitbit.com/1/user/-/activities/heart/date/' + date + '.json', this.constructHeaders());
    }

    /**
     * Method for /devices endpoint
     * @TODO add support for alarms
     *
     * @return {Promise}
     */

  }, {
    key: 'getDevices',
    value: function getDevices() {
      return this.sendRequest('GET', 'https://api.fitbit.com/1/user/-/devices.json', this.constructHeaders());
    }

    /**
     * Method for friends endpoint
     * @TODO add support for freinds leaderboard
     */

  }, {
    key: 'getFriends',
    value: function getFriends() {
      return this.sendRequest('GET', 'https://api.fitbit.com/1/user/-/friends.json', this.constructHeaders());
    }
  }]);

  return FitBit;
}();

exports.default = FitBit;