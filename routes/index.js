var express = require('express');
var router = express.Router();
const config = require('../lib/config');
var request = require('request');

router.put('/Observation/:id', function(req, res, next) {

  headers = [];
  row = [];

  try {

    req.body.component.forEach(function(measure) {

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

           console.log(response.body)

      } else {

           console.log(error)

      }

      res.sendStatus(200);

   });


});

module.exports = router;
