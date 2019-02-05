var express = require('express');
var router = express.Router();
var fs = require('fs');
var request = require('request');
var config = require('../lib/config.js');

router.get('/', function(req, res, next) {

    // TODO: Create patient resource if does not exist (assume default Practitioner and Organization already in system).

    request.post(
        {
           method: "POST",
           url : config.FHIR_SERVER_URL + config.FHIR_REST_ENDPOINT + "Observation?_format=json",
           headers: {
             "Content-Type": "application/fhir+json; charset=UTF-8"
           },
           body: fs.readFileSync('fhir-json-templates/bp.json', 'utf8')
        },
        function (error, response, body) {

         console.log(response);
         res.sendStatus(200);

        }
    );

});

module.exports = router;
