import request from 'request';
import base64 from 'base-64';
import moment from 'moment';

const today = moment().format('YYYY-MM-DD');

export default class FitBit {
  /**
   * @constructor
   * @param {object} data
   */
  constructor(data) {
    this.data = data;
  }

  /**
   * Constructs headers needed to send to api
   * @param {string} type Type of request (basic|bearer)
   */
  constructHeaders(type = 'bearer') {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (type === 'basic') {
      headers.Authorization = `Basic ${base64.encode(`${this.data.clientId}:${this.data.clientSecret}`)}`;
    } else if (type === 'bearer') {
      headers.Authorization = `Bearer ${process.env.fitbitAccessToken}`;
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
  sendRequest(method = 'GET', url, headers, data = {}, callback, auth = false) {
    return new Promise((fulfill, reject) => {
      let callbackFn;
      if (!callback) {
        callbackFn = (err, response, body) => {
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
        this.refreshToken()
        .then(() => {
          request.get({
            url,
            headers,
            form: data,
          }, callbackFn);
        });
      } else {
        request.post({
          url,
          headers,
          form: data,
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
  authorize(code) {
    return new Promise((resolve, reject) => {
      this.sendRequest(
        'POST',
        'https://api.fitbit.com/oauth2/token',
        this.constructHeaders('basic'),
        {
          client_id: this.data.clientId,
          grant_type: 'authorization_code',
          redirect_uri: this.data.callbackUrl,
          code,
        },
        (err, res, body) => {
          if (err || res.statusCode >= 400) {
            console.log(err);
            reject(err || body);
          } else {
            const output = JSON.parse(body);
            process.env.fitbitAccessToken = output.access_token;
            process.env.fitbitRefreshToken = output.refresh_token;
            console.log({
              refreshToken: process.env.fitbitRefreshToken,
              accessToken: process.env.fitbitAccessToken,
            });
            resolve(output);
          }
        },
        true,
      );
    });
  }

  /**
   * Gets a new access token for FitBit
   *
   * @return {Promise}
   */
  refreshToken() {
    return new Promise((resolve, reject) => {
      this.sendRequest(
        'POST',
        'https://api.fitbit.com/oauth2/token',
        this.constructHeaders('basic'),
        {
          grant_type: 'refresh_token',
          refresh_token: process.env.fitbitRefreshToken,
        },
        (err, res, body) => {
          if (err || res.statusCode >= 400) {
            reject(err || body);
          } else {
            const output = JSON.parse(body);
            process.env.fitbitAccessToken = output.access_token;
            process.env.fitbitRefreshToken = output.refresh_token;
            console.log({
              refreshToken: process.env.fitbitRefreshToken,
              accessToken: process.env.fitbitAccessToken,
            });
            resolve(output);
          }
        },
        true,
      );
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
  getActivity(endpoint = 'activities', date = today) {
    return this.sendRequest(
      'GET',
      `https://api.fitbit.com/1/user/-/${endpoint}/date/${date}.json`,
      this.constructHeaders(),
    );
  }

  /**
   * Method for /sleep endpoint
   * @source https://dev.fitbit.com/docs/sleep/
   * @TODO addsupport sleep logs list
   *
   * @param {string} date Date(s) requesting
   * @return {Promise}
   */
  getSleep(date = moment().subtract(1, 'days').format('YYYY-MM-DD')) {
    return this.sendRequest(
      'GET',
      `https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`,
      this.constructHeaders(),
    );
  }

  /**
   * Method for /heart endpoint
   *
   * @param {string} date Date(s) requesting
   * @return {Promise}
   */
  getHeartRate(date = `today/1d`) {
    return this.sendRequest(
      'GET',
      `https://api.fitbit.com/1/user/-/activities/heart/date/${date}.json`,
      this.constructHeaders(),
    );
  }

  /**
   * Method for /devices endpoint
   * @TODO add support for alarms
   *
   * @return {Promise}
   */
  getDevices() {
    return this.sendRequest(
      'GET',
      'https://api.fitbit.com/1/user/-/devices.json',
      this.constructHeaders(),
    );
  }

  /**
   * Method for friends endpoint
   * @TODO add support for freinds leaderboard
   */
  getFriends() {
    return this.sendRequest(
      'GET',
      'https://api.fitbit.com/1/user/-/friends.json',
      this.constructHeaders(),
    );
  }
}
