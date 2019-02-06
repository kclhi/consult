var express = require('express');
var router = express.Router();
const config = require('../lib/config');
var request = require('request');

router.put('/Observation/:id', function(req, res, next) {

    headers = [];
    row = [];

    try {

        req.body.component.forEach(function(measure) {

            // TODO: get username
            
            // 'c' added (code) as in R colum name references cannot be numerical.
            headers.push("c" + measure["code"].coding[0].code);
            row.push(measure["valueQuantity"].value);

        });

    } catch(error) {

        console.log(error);

    }

    // TODO: Determine miner endpoint based on content of FHIR resource.
    request.post(config.DATA_MINER_URL + "/check/bp", {
        json: {
          "nn": "7",
          "csv": headers.toString() + "\n" + row.toString(),
        },
    },
    function (error, response, body) {

        if (!error && response.statusCode == 200) {

             // TODO: Generic term that indicates the issue, and potentially indicates which dialogue to start.
             if ( response.body.contains("Raised") ) {

                 request.post(config.DIALOGUE_MANAGER_URL + "/initiate", {
                     json: {
                       // TODO: Something from the data miner response that indicates which dialogue to initiate.
                       "dialogue": "/2",
                       // TODO: Assume username on chat is the same as Patient ID in FHIR or query a service storing a mapping between the two.
                       "username": "@user",
                     },
                 },
                 function (error, response, body) {

                     if (!error && response.statusCode == 200) {

                          console.log(response.body);

                     } else {

                          console.log(error);

                     }

                 });

             }

        } else {

             console.log(error)

        }

        res.sendStatus(200);

    });

});

module.exports = router;
