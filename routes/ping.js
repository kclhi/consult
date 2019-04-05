const express = require('express');
const router = express.Router();
const models = require('../models');
const oauthSignature = require('oauth-signature');
const jsonFind = require('json-find');
const request = require('request');
const logger = require('../config/winston');

const config = require('config');
const utils = require('../lib/utils');

module.exports = function(messageObject) {

  router.post('/ping', (req, res) => {

    logger.info(req.body);

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
        oauth_consumer_key: config.get('garmin.CONSUMER_KEY'),
        oauth_token: token,
        oauth_nonce: require('crypto').randomBytes(16).toString('base64'),
        oauth_timestamp: Math.floor(new Date() / 1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version: '1.0'
      };

      other = {
        uploadStartTimeInSeconds: doc.checkKey('uploadStartTimeInSeconds'),
        uploadEndTimeInSeconds: doc.checkKey('uploadEndTimeInSeconds')
      };

      const callbackURL = doc.checkKey('callbackURL');

      if ( callbackURL ) {

        authorisation["oauth_signature"] = oauthSignature.generate("GET", callbackURL.substring(0, callbackURL.indexOf('?')), { ...authorisation, ...other }, config.get('garmin.SECRET'), user.secret, { encodeSignature: false });

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

        	  logger.error(error);

          }

          if ( Object.keys(heartRateExtract).length > 0 && heartRateExtract.restingHeartRateInBeatsPerMinute ) {

            heartRateExtract["reading"] = "HR";
            heartRateExtract["id"] = summaryId;
            heartRateExtract["subjectReference"] = user.id;
            heartRateExtract["practitionerReference"] = "da6da8b0-56e5-11e9-8d7b-95e10210fac3"; // TODO: determine which practitioner to reference.

            // startTimeInSeconds from API is missing trailing zeros.
            const secondsInMeasurementRange = (Date.now() - parseInt(startTimeInSeconds + "000")) / 1000;
            const totalActivitySeconds = parseInt(moderateIntensityDurationInSeconds) + parseInt(vigorousIntensityDurationInSeconds);

            heartRateExtract["intensityDurationPercentage"] = (totalActivitySeconds / secondsInMeasurementRange) * 100;

            messageObject.send(config.get('sensor_to_fhir.URL') + "/create/hr", heartRateExtract).then(function() {

              logger.info("Sent HR reading to sensor-fhir-mapper.");
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

  return router;

}
