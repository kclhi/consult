var express = require('express');
var router = express.Router();
var request = require('request');
var models = require('../models');
const config = require('../lib/config');
var oauthSignature = require('oauth-signature');

router.get('/daily/:id/:start/:end', (req, res) => {

    models.users.findOne({

      where: {

        id: req.params.id

      },

    }).then(function(user) {

    	var url = 'https://healthapi.garmin.com/wellness-api/rest/dailies',
    	authorisation = {
    		oauth_consumer_key : config.GARMIN_CONSUMER_KEY,
    		oauth_token : user.token,
    		oauth_nonce : require('crypto').randomBytes(16).toString('base64'),
    		oauth_timestamp : Math.floor(new Date() / 1000),
    		oauth_signature_method : 'HMAC-SHA1',
    		oauth_version : '1.0'
    	};

      other = {
        uploadStartTimeInSeconds: req.params.start,
        uploadEndTimeInSeconds: req.params.end
      };

      authorisation["oauth_signature"] = oauthSignature.generate("GET", url, { ...authorisation, ...other }, config.GARMIN_SECRET, user.secret, { encodeSignature: false });

      authorisation = 'OAuth ' + require('querystring').stringify(authorisation, '", ', '="') + '"';

      request(
          {
              url : url + "?" + require('querystring').stringify(other),
              headers: {
                "Authorization": authorisation
              },
          },
          function (error, response, body) {

            res.end(body);

          }
      );

   });

});

module.exports = router;
