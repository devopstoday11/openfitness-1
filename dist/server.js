'use strict';

var express = require('express');
var moment = require('moment');
var bodyParser = require('body-parser');
var FitBit = require('../dist/fitbit/').default;
var env = require('../env');

var app = express();
var today = moment().format('YYYY-MM-DD');
var yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
app.use(bodyParser.json({ type: 'application/*+json' }));
app.set('json spaces', 2);

var fitbitApi = new FitBit({
  clientId: env.fitbitClientId,
  clientSecret: env.fitbitClientSecret,
  callbackUrl: env.fitbitCallbackUrl,
  accessToken: env.fitbitAccessToken,
  refreshToken: env.fitbitRefreshToken,
  userId: env.fitbitUserId
});

app.get('/', function (req, res) {
  res.json({ success: true });
});

app.get('/api/v1/fitbit-redirect', function (req, res) {
  var code = req.query.code;
  fitbitApi.authorize(code).then(function () {
    res.json({ message: 'You have successfully authenticated.' });
  }, function () {
    res.status(400).json({ message: 'There was an error authenticating.' });
  });
});

app.get('/api/v1/fitbit', function (req, res) {
  Promise.all([fitbitApi.getActivity('activities/distance', '2017-04-21/1m'), fitbitApi.getSleep(), fitbitApi.getHeartRate('2017-04-21/1d'), fitbitApi.getDevices()]).then(function (output) {
    res.status(200).json({
      activity: JSON.parse(output[0]),
      sleep: JSON.parse(output[1]),
      heart: JSON.parse(output[2]),
      devices: JSON.parse(output[3])
    });
  }, function () {
    res.status(400).json({});
  });
});

app.listen(env.port);
console.log('LISTENING ON PORT ' + env.port);