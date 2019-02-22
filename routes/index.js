var express = require('express');
var router = express.Router();
var fs = require('fs');
var request = require('request');
var config = require('../lib/config.js');

function createFHIRResource(reading, data, callback) {

  // TODO: Create patient resource if does not exist (assume default Practitioner and Organization already in system).

  var template = fs.readFileSync("fhir-json-templates/" + reading + ".json", 'utf8');

  template = template.replace("[effectiveDateTime]", new Date().toISOString());

  Object.keys(data).forEach(function(key) {

    template = template.replace("[" + key + "]", data[key]);

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
      body: template
    },
    function (error, response, body) {

      if (!error && response.statusCode == 201) {

        console.log(response.statusCode);
        callback(200);

      } else {

        console.log(error + " " + response.statusCode);
        callback(200);

      }

    }

  );

}
router.post('/hr', function(req, res, next) {

  createFHIRResource("hr", req.body, function(status) { res.sendStatus(status); });

});

router.post('/bp', function(req, res, next) {

  createFHIRResource("bp", req.body, function(status) { res.sendStatus(status); });

});

module.exports = router;
