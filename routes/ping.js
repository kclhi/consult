var express = require('express');
var router = express.Router();
var models = require('../models');

router.post('/ping', (req, res) => {

  console.log(req.body);
  res.sendStatus(200);

  authorisation = {
    oauth_consumer_key : config.GARMIN_CONSUMER_KEY,
    oauth_token : req.body.userAccessToken,
    oauth_nonce : require('crypto').randomBytes(16).toString('base64'),
    oauth_timestamp : Math.floor(new Date() / 1000),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0'
  };

  other = {
    uploadStartTimeInSeconds: req.body.uploadStartTimeInSeconds,
    uploadEndTimeInSeconds: req.body.uploadEndTimeInSeconds
  };

  authorisation["oauth_signature"] = oauthSignature.generate("GET", url, { ...authorisation, ...other }, config.GARMIN_SECRET, user.secret, { encodeSignature: false });

  authorisation = 'OAuth ' + require('querystring').stringify(authorisation, '", ', '="') + '"';

  request(
      {
          url : req.body.callbackURL,
          headers: {
            "Authorization": authorisation
          },
      },
      function (error, response, body) {

        console.log(response);
        res.end(body);

      }
  );

});

module.exports = router;
