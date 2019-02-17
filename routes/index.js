var express = require('express');
var router = express.Router();
const config = require('../lib/config');
var request = require('request');
var lastAlert;
var async = require('async');

function callFHIRServer(query, params, callback) {

  var url = config.FHIR_SERVER_URL + config.FHIR_REST_ENDPOINT + query + "/_history/1?_format=json" + params;

  request.get(url, {

    headers: {
     "Authorization": "Basic " + new Buffer(config.USERNAME + ":" + config.PASSWORD).toString("base64"),
    },

  }, function(error, response, body) {

      callback(body);

  });

}

router.put('/Observation/:id', function(req, res, next) {

  bpHeaders = [];
  patientHeaders = [];
  bpRow = [];
  patientRow = [];

  const patientID = req.body.subject.reference.replace("Patient/", "");

  // Get patient stats
  bpHeaders.push("pid");
  bpRow.push(patientID);

  callFHIRServer("Patient/" + patientID, "", function(patientData) {

      patientHeaders.push("birthDate");
      patientRow.push(JSON.parse(patientData).birthDate);

      patientHeaders.push("ethnicity");
      patientRow.push(JSON.parse(patientData).extension[0].extension[0].valueCoding.display);

      callFHIRServer("MedicationDispense", "subject=" + patientID, function(medicationDispenseData) {

          async.each(JSON.parse(medicationDispenseData).entry, function(medicationDispense, callback) {

              var medication = 1;

              callFHIRServer(medicationDispense.resource.medicationReference.reference, "", function(medicationData) {

                  patientHeaders.push("medication" + medication)
                  patientRow.push(JSON.parse(medicationData)['code']['coding'][0].display);
                  medication += 1;
                  callback();

              });

          }, function(medicationDispenseDataError) {

              callFHIRServer("Condition", "subject=" + patientID, function(conditionData, callback) {

                  var problem = 1;

                  JSON.parse(conditionData).entry.forEach(function(condition) {

                      patientHeaders.push("problem" + problem)
                      problem += 1;
                      patientRow.push(condition.resource.code.coding[0].display);

                  });

                  // Get observation stats
                  req.body.component.forEach(function(measure) {

                      // 'c' added (code) as in R colum name references cannot be numerical.
                      bpHeaders.push("c" + measure["code"].coding[0].code);
                      bpRow.push(measure["valueQuantity"].value);

                  });

                  // TODO: Determine miner endpoint based on content of FHIR resource.
                  request.post(config.DATA_MINER_URL + "/check/bp", {
                      json: {
                        "bp": bpHeaders.toString() + "\n" + bpRow.toString(),
                        "nn": "7",
                        "ehr": patientHeaders.toString() + "\n" + patientRow.toString()
                      },
                  },
                  function (error, response, body) {

                      console.log("Data miner: " + response.statusCode);

                      if (!error && response.statusCode == 200) {

                          var minutesSinceLastAlert = Number.MAX_SAFE_INTEGER;

                          if ( lastAlert ) {

                              minutesSinceLastAlert = Math.floor(((new Date().getTime() - lastAlert.getTime()) / 1000) / 60);

                          }

                          // TODO: Miner response is oddly nested.
                          minerResponse = JSON.parse(response.body[0]);

                          // TODO: Generic term that indicates the issue, and potentially indicates which dialogue to start.
                          if ( response.body && minerResponse[0]["bp.trend"].indexOf("Raised") > -1 && minutesSinceLastAlert > config.MAX_ALERT_PERIOD) {

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
                                        lastAlert = new Date();
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

          });

      });

   });

});

module.exports = router;
