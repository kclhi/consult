var express = require('express');
var router = express.Router();
const config = require('../lib/config');
var request = require('request');

router.put('/Observation/:id', function(req, res, next) {

    headers = [];
    row = [];

    try {

        req.body.component.forEach(function(measure) {

            // TODO: get Patient ID.

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

        console.log("Data miner: " + response.statusCode);

        if (!error && response.statusCode == 200) {

             // TODO: Generic term that indicates the issue, and potentially indicates which dialogue to start.
             if ( response.body && response.body[0].indexOf("Raised") > -1) {

                 request({
                    method: "POST",
                    url: config.DIALOGUE_MANAGER_URL + "/dialogue/initiate",
                    headers: {
                     "Authorization": "Basic " + new Buffer(config.USERNAME + ":" + config.PASSWORD).toString("base64")
                    },
                    json: {
                       // TODO: Something from the data miner response that indicates which dialogue to initiate.
                       "dialogueID": "2",
                       // TODO: Assume username on chat is the same as Patient ID in FHIR or query a service storing a mapping between the two.
                       "username": "user",
                    }
                 },
                 function (error, response, body) {

                     console.log("Dialogue manager: " + response.statusCode);

                     if (!error && response.statusCode == 200) {

                          console.log(response.statusCode);
                          res.sendStatus(200);

                     } else {

                          console.log(error);
                          res.sendStatus(400);

                     }

                 });

             } else {

               res.sendStatus(200);

             }

        } else {

             console.log(error);
             res.sendStatus(400);

        }

    });

});

module.exports = router;
