const express = require('express');
const router = express.Router();
const fs = require('fs');
const request = require('request');
const config = require('../lib/config.js');
const utils = require('../lib/utils.js');

function createFHIRResource(reading, data, callback) {

  // TODO: Create patient resource if does not exist (assume default Practitioner and Organization already in system).

  var template = fs.readFileSync("fhir-json-templates/" + reading + ".json", 'utf8');

  template = template.replace("[effectiveDateTime]", new Date().toISOString());

  Object.keys(data).forEach(function(key) {

    template = template.replace("[" + key + "]", data[key]);

  });

  utils.callFHIRServer(config.FHIR_SERVER_URL + config.FHIR_REST_ENDPOINT + "Observation?_format=json", template, function(statusCode) {

    callback(statusCode)

  });

}
router.post('/hr', function(req, res, next) {

  // TODO: If using time offsets, pre-process here as set of individual readings, and ensure repeat readings are not sent (i.e. choose timestamp).
  createFHIRResource("hr", req.body, function(status) { res.sendStatus(status); });

});

router.post('/bp', function(req, res, next) {

  createFHIRResource("bp", req.body, function(status) { res.sendStatus(status); });

});

module.exports = router;
