const express = require('express');
const router = express.Router();
const config = require('config');

const request = require('request');

const logger = require('../config/winston');

function callArgEngine(path, callback) {

  request({
    method: "GET",
    url : config.get('argumentation_engine.URL') + "/tips" + path,
    //headers: {
     //"Authorization": "Basic " + new Buffer(username + ":" + password).toString("base64"),
    //},
    requestCert: true
  },
  function (error, response, body) {

    if (!error && response.statusCode <= 201) {

      callback(body);

    } else {

      console.log("Error when contacting argumentation engine: " + path + " " + error + " " + ( ( body && typeof body === "object" ) ? JSON.stringify(body) : body ) + " " + ( response && response.statusCode ? response.statusCode : "Status unknown." ));
      callback("Unable to fetch tip.");

    }

  });

}

router.get('/all', function(req, res, next) {

  callArgEngine("/all", function(response) {

    res.send(response);

  });

});

router.get('/random', function(req, res, next) {

  callArgEngine("/response", function(response) {

    res.send(response);

  });

});

module.exports = router;
