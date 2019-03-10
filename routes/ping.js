const express = require('express');
const router = express.Router();
const models = require('../models');
const oauthSignature = require('oauth-signature');
const jsonFind = require('json-find');
const request = require('request');

const config = require('../lib/config');
const utils = require('../lib/utils');

router.post('/ping', (req, res) => {

  console.log(req.body);

  models.notifications.create({

		data: JSON.stringify(req.body)

	});

  const doc = jsonFind(req.body);

  const token = doc.checkKey('userAccessToken')

  models.users.findOne({

    where: {

      token: token

    },

  }).then(function(user) {

    authorisation = {
      oauth_consumer_key : config.GARMIN_CONSUMER_KEY,
      oauth_token : token,
      oauth_nonce : require('crypto').randomBytes(16).toString('base64'),
      oauth_timestamp : Math.floor(new Date() / 1000),
      oauth_signature_method : 'HMAC-SHA1',
      oauth_version : '1.0'
    };

    other = {
      uploadStartTimeInSeconds: doc.checkKey('uploadStartTimeInSeconds'),
      uploadEndTimeInSeconds: doc.checkKey('uploadEndTimeInSeconds')
    };

    const callbackURL = doc.checkKey('callbackURL');

    if ( callbackURL ) {

      authorisation["oauth_signature"] = oauthSignature.generate("GET", callbackURL.substring(0, callbackURL.indexOf('?')), { ...authorisation, ...other }, config.GARMIN_SECRET, user.secret, { encodeSignature: false });

      authorisation = 'OAuth ' + require('querystring').stringify(authorisation, '", ', '="') + '"';

      request({
        url: callbackURL,
        headers: {
          "Authorization": authorisation
        },
      },
      function (error, response, body) {

        var heartRateExtract = {};
        var summaryId;
        var startTimeInSeconds;
        var moderateIntensityDurationInSeconds;
        var vigorousIntensityDurationInSeconds;

      	try {

          const parsedBody = JSON.parse(body);
          summaryId = utils.replaceAll(parsedBody[0]["summaryId"], "-", "");
          startTimeInSeconds = parsedBody[0]["startTimeInSeconds"]
          moderateIntensityDurationInSeconds = parsedBody[0]["moderateIntensityDurationInSeconds"];
          vigorousIntensityDurationInSeconds = parsedBody[0]["vigorousIntensityDurationInSeconds"];

          Object.keys(parsedBody[0]).forEach(function(key) {

            if (key.indexOf("HeartRate") >= 0 || key.indexOf("Intensity") >= 0 ) {

              value = parsedBody[0][key];
      		    if ( typeof value === 'object' ) value = JSON.stringify(value);
      		    heartRateExtract[key] = value;

            }

          });

        } catch(error) {

      	  console.log(error);

        }

        if ( Object.keys(heartRateExtract).length > 0 ) {

          heartRateExtract["id"] = summaryId;
          heartRateExtract["subjectReference"] = user.id;

          // startTimeInSeconds from API is missing trailing zeros.
          const secondsInMeasurementRange = (Date.now() - parseInt(startTimeInSeconds + "000")) / 1000;
          const totalActivitySeconds = parseInt(moderateIntensityDurationInSeconds) + parseInt(vigorousIntensityDurationInSeconds);

          heartRateExtract["intensityDurationPercentage"] = (totalActivitySeconds / secondsInMeasurementRange) * 100;

          request.post(config.SENSOR_TO_FHIR_URL + "convert/hr", {

						json: heartRateExtract

  				},
  				function (error, response, body) {

						if (!error && response.statusCode == 200) {

							console.log(response.body)

						} else {

							console.log(error)

						}

            res.sendStatus(200);

  				});

        } else {

          res.sendStatus(200);

        }

      });

    } else {

      res.sendStatus(200);

    }

  });

});

module.exports = router;
