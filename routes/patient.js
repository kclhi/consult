const express = require('express');
const router = express.Router();
const request = require('request');
const async = require('async');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const config = require('config');

const provenance = require('../lib/provenance');
const utils = require('../lib/utils');

router.put('/:id', function(req, res, next) {

  request({

    method: "POST",
    url: config.get('dialogue_manager.URL') + "/user/create",
    headers: {

     "Authorization": "Basic " + new Buffer(config.get('credentials.USERNAME') + ":" + config.get('credentials.PASSWORD')).toString("base64")

    },
    json: {
      "username": req.body.id,
      "password": req.body.password,
      "email": req.body.email
    },
    rejectUnauthorized: false,
    requestCert: true

  },
  function (error, response, body) {

    if (!error && ( response && response.statusCode == 200 ) ) {

      res.send(200);

    } else {

      console.log("Could not contact the dialogue manager. " + error + " " + ( response && response.body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ) + " " + ( response && response.statusCode ? response.statusCode : "" ));
      res.send(400);

    }

  });

});

module.exports = router;
