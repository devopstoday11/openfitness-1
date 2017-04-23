const express = require('express');
const moment = require('moment');
const bodyParser = require('body-parser');
const FitBit = require('../dist/fitbit/').default;
const env = require('../env');


const app = express();
const today = moment().format('YYYY-MM-DD');
const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
app.use(bodyParser.json({ type: 'application/*+json' }));
app.set('json spaces', 2);

const fitbitApi = new FitBit({
  clientId: env.fitbitClientId,
  clientSecret: env.fitbitClientSecret,
  callbackUrl: env.fitbitCallbackUrl,
  accessToken: env.fitbitAccessToken,
  refreshToken: env.fitbitRefreshToken,
  userId: env.fitbitUserId,
});

app.get('/', (req, res) => {
  res.json({ success: true });
});

app.get('/api/v1/fitbit-redirect', (req, res) => {
  const code = req.query.code;
  fitbitApi.authorize(code)
  .then(() => {
    res.json({ message: 'You have successfully authenticated.' });
  }, () => {
    res.status(400).json({ message: 'There was an error authenticating.' });
  });
});

app.get('/api/v1/fitbit', (req, res) => {
  Promise.all([
    fitbitApi.getActivity('activities/distance', '2017-04-21/1m'),
    fitbitApi.getSleep(),
    fitbitApi.getHeartRate('2017-04-21/1d'),
    fitbitApi.getDevices(),
  ])
  .then(output => {
    res.status(200).json({
      activity: JSON.parse(output[0]),
      sleep: JSON.parse(output[1]),
      heart: JSON.parse(output[2]),
      devices: JSON.parse(output[3]),
    });
  }, () => {
    res.status(400).json({});
  });
});

app.listen(env.port);
console.log(`LISTENING ON PORT ${env.port}`);
