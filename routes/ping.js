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

    authorisation["oauth_signature"] = oauthSignature.generate("GET", callbackURL.substring(0, callbackURL.indexOf('?')), { ...authorisation, ...other }, config.GARMIN_SECRET, user.secret, { encodeSignature: false });

    authorisation = 'OAuth ' + require('querystring').stringify(authorisation, '", ', '="') + '"';

    request({
      url: callbackURL,
      headers: {
        "Authorization": authorisation
      },
    },
    function (error, response, body) {
      
      console.log(body);
      res.sendStatus(200);
      
    });

  });

});

module.exports = router;
