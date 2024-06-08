const express = require('express');
const router = express.Router();
const models = require('../models');
const oauthSignature = require('oauth-signature');
const request = require('request');
const logger = require('../config/winston');

const config = require('config');
const utils = require('../lib/utils');

module.exports = function(messageObject) {

  router.post('/ping', (req, res) => {

    if ( notificationContent = req.body ) {

      logger.debug(notificationContent);

      models.notifications.create({ data: JSON.stringify(notificationContent) });

      if ( Array.isArray(Object.keys(notificationContent)) && Object.keys(notificationContent).length == 1 && ( firstNotificationKey = Object.keys(notificationContent)[0] ) && Array.isArray(notificationContent[firstNotificationKey]) && notificationContent[firstNotificationKey].length == 1 && ( notificationContentBody = notificationContent[firstNotificationKey][0] ) ) {

        if ( ( userAccessToken = notificationContentBody.userAccessToken ) && notificationContentBody.uploadStartTimeInSeconds && notificationContentBody.uploadEndTimeInSeconds ) {

          models.users.findOne({
            where: {

              token: userAccessToken

            },
          }).then(function(user) {

            if ( user ) {

              authorisation = {
                oauth_consumer_key: config.get('garmin.CONSUMER_KEY'),
                oauth_token: userAccessToken,
                oauth_nonce: require('crypto').randomBytes(16).toString('base64'),
                oauth_timestamp: Math.floor(new Date() / 1000),
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0'
              };

              other = {
                uploadStartTimeInSeconds: notificationContentBody.uploadStartTimeInSeconds,
                uploadEndTimeInSeconds: notificationContentBody.uploadEndTimeInSeconds
              };

              if ( callbackURL = notificationContentBody.callbackURL ) {

                authorisation["oauth_signature"] = oauthSignature.generate("GET", callbackURL.substring(0, callbackURL.indexOf('?')), { ...authorisation, ...other }, config.get('garmin.SECRET'), user.secret, { encodeSignature: false });

                authorisation = 'OAuth ' + require('querystring').stringify(authorisation, '", ', '="') + '"';

                request({
                  url: callbackURL,
                  headers: {
                    "Authorization": authorisation
                  },
                },
                function (error, response, body) {

                  if ( firstNotificationKey == "dailies" ) {

                    if ( ( parsedReadingBody = utils.JSONParseWrapper(body) ) && Array.isArray(parsedReadingBody) && parsedReadingBody.length == 1 && ( readingBody = parsedReadingBody[0] ) ) {

                      const summaryId = utils.replaceAll(readingBody.summaryId, "-", "");
                      const restingHeartRateInBeatsPerMinute = readingBody.restingHeartRateInBeatsPerMinute;
                      const maxHeartRateInBeatsPerMinute = readingBody.maxHeartRateInBeatsPerMinute;
                      const moderateIntensityDurationInSeconds = readingBody.moderateIntensityDurationInSeconds;
                      const vigorousIntensityDurationInSeconds = readingBody.vigorousIntensityDurationInSeconds;
                      const startTimeInSeconds = readingBody.startTimeInSeconds;

                      if ( summaryId && restingHeartRateInBeatsPerMinute && maxHeartRateInBeatsPerMinute ) {

                        var heartRateExtract = {};
                        heartRateExtract["reading"] = "HR";
                        heartRateExtract["id"] = summaryId;
                        heartRateExtract["subjectReference"] = user.id;
                        heartRateExtract["practitionerReference"] = "da6da8b0-56e5-11e9-8d7b-95e10210fac3"; // TODO: determine which practitioner to reference.
                        heartRateExtract["c40443h4"] = restingHeartRateInBeatsPerMinute;
                        heartRateExtract["c8867h4"] = maxHeartRateInBeatsPerMinute;

                        if ( moderateIntensityDurationInSeconds && vigorousIntensityDurationInSeconds && startTimeInSeconds ) {

                          try {

                            // startTimeInSeconds from API is missing trailing zeros.
                            const totalActivitySeconds = parseInt(moderateIntensityDurationInSeconds) + parseInt(vigorousIntensityDurationInSeconds);
                            const secondsInMeasurementRange = (Date.now() - parseInt(startTimeInSeconds + "000")) / 1000;

                            if ( totalActivitySeconds > 0 && secondsInMeasurementRange > 0 ) {

                              const intensityDurationPercentage = (totalActivitySeconds / secondsInMeasurementRange) * 100;
                              heartRateExtract["c82290h8"] = Math.round(ntensityDurationPercentage * 100) / 100;

                            } else {

                              logger.error("Values not in correct range for activity calculation. totalActivitySeconds: " + totalActivitySeconds + " secondsInMeasurementRange: " + secondsInMeasurementRange);
                              heartRateExtract["c82290h8"] = 0;

                            }

                          } catch(error) {

                            logger.error("Error parsing data for activity calculation: " + error);
                            heartRateExtract["c82290h8"] = 0;

                          }

                        } else {

                          logger.debug("No intensity information available for activity calculation\s, setting to zero.");
                          if (!moderateIntensityDurationInSeconds) logger.info("moderateIntensityDurationInSeconds does not exist.");
                          if (!vigorousIntensityDurationInSeconds) logger.info("vigorousIntensityDurationInSeconds does not exist.");
                          if (!startTimeInSeconds) logger.error("startTimeInSeconds does not exist.");
                          heartRateExtract["c82290h8"] = 0;

                        }

                        messageObject.send(config.get('sensor_to_fhir.URL') + "/create/hr", heartRateExtract).then(function() {

                          logger.info("Sent HR reading to sensor-fhir-mapper.");
                          res.sendStatus(200);

                        });

                      } else {

                        if (!summaryId) logger.error("summaryId does not exist.");
                        if (!restingHeartRateInBeatsPerMinute) logger.info("restingHeartRateInBeatsPerMinute does not exist.");
                        if (!maxHeartRateInBeatsPerMinute) logger.info("maxHeartRateInBeatsPerMinute does not exist.");
                        logger.error("Reading body: " + JSON.stringify(readingBody));
                        res.sendStatus(200);

                      }

                    } else {

                      logger.error("Could not parse reading body: " + ( body && typeof body === "object" ? JSON.stringify(body) : body));
                      res.sendStatus(200);

                    }

                  } else {

                    logger.info("Received untracked notification of type: " + firstNotificationKey);
                    res.sendStatus(200);

                  }

                });

              } else {

                logger.debug("Callback URL not found.");
                res.sendStatus(200);

              }

            } else {

              logger.debug("No user found for this notification.");
              res.sendStatus(200);

            }

          });

        } else {

          logger.error("Could not parse notification content body for user access token: " + JSON.stringify(notificationContentBody));
          res.sendStatus(200);

        }

      } else {

        logger.error("Notification not in expected structure: " + JSON.stringify(notificationContent));
        res.sendStatus(200);

      }

    } else {

      logger.error("Could not parse notification content received: " + ( req.body && typeof req.body === "object" ? JSON.stringify(req.body) : req.body));
      res.sendStatus(200);

    }

  });

  return router;

}
