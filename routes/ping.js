var express = require('express');
var router = express.Router();
var models = require('../models');
const config = require('../lib/config');
var oauthSignature = require('oauth-signature');
var jsonFind = require('json-find');
var request = require('request');

router.post('/ping', (req, res) => {

  console.log(req.body);

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

      	try {

          var parsedBody = JSON.parse(body);

          Object.keys(parsedBody[0]).forEach(function(key) {

            if (key.indexOf("HeartRate") >= 0) {

              value = parsedBody[0][key];
      		    if ( typeof value === 'object' ) value = JSON.stringify(value);
      		    heartRateExtract[key] = value;

            }

          });

        } catch(error) {

      	  console.log(error);

        }

        if ( Object.keys(heartRateExtract).length > 0 ) {

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
