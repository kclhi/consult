var express = require('express');
var router = express.Router();
var fs = require('fs');
var request = require('request');
var config = require('../lib/config.js');

router.post('/hr', function(req, res, next) {

  console.log(req.body);
  res.sendStatus(200);

});

router.post('/bp', function(req, res, next) {

  // TODO: Create patient resource if does not exist (assume default Practitioner and Organization already in system).

  var bpTemplate = fs.readFileSync('fhir-json-templates/bp.json', 'utf8');

  bpTemplate = bpTemplate.replace("[effectiveDateTime]", new Date().toISOString());

  Object.keys(req.body).forEach(function(key) {

    bpTemplate = bpTemplate.replace("[" + key + "]", req.body[key]);

  });

  request(
    {
      method: "POST",
      url : config.FHIR_SERVER_URL + config.FHIR_REST_ENDPOINT + "Observation?_format=json",
      headers: {
       "Authorization": "Basic " + new Buffer(config.FHIR_USERNAME + ":" + config.FHIR_PASSWORD).toString("base64"),
       "Content-Type": "application/fhir+json; charset=UTF-8"
      },
      rejectUnauthorized: false,
      requestCert: true,
      body: bpTemplate
    },
    function (error, response, body) {

      if (!error && response.statusCode == 201) {

        console.log(response.statusCode);
        res.sendStatus(200);

      } else {

        console.log(error + " " + response.statusCode);

      }

    }

  );

});

module.exports = router;
