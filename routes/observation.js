const express = require('express');
const router = express.Router();
const request = require('request');
const async = require('async');
const fs = require('fs');

const provenance = require('../lib/provenance');
const config = require('../lib/config');
const utils = require('../lib/utils');

var lastAlert;

function populateProvenanceTemplateBP(pid, code, value, callback) {

  var fragment = fs.readFileSync('provenance-templates/template-bp-fragment.json', 'utf8');
  fragment = fragment.replace("[pid]", pid);
  fragment = fragment.replace("[company]", "Nokia");
  fragment = fragment.replace("[code]", code);
  fragment = fragment.replace("[value]", value);

  const ID = pid + "Nokia" + code + value + Date.now();
  provenance.add(ID, fragment, "temp-0", "provenance-templates/template-bp.json", function(response) { callback(response); });

}

function getPatientStats(patientID, callback) {

  patientHeaders = [];
  patientRow = [];

  utils.callFHIRServer("Patient/" + patientID, "", function(patientData) {

    patientHeaders.push("birthDate");
    patientRow.push(JSON.parse(patientData).birthDate);

    patientHeaders.push("ethnicity");
    patientRow.push(JSON.parse(patientData).extension[0].extension[0].valueCoding.display);

    utils.callFHIRServer("MedicationDispense", "subject=" + patientID, function(medicationDispenseData) {

      // TODO: Remove async.
      async.each(JSON.parse(medicationDispenseData).entry, function(medicationDispense, callback) {

        var medication = 1;

        utils.callFHIRServer(medicationDispense.resource.medicationReference.reference, "", function(medicationData) {

          patientHeaders.push("medication" + medication)
          patientRow.push(JSON.parse(medicationData)['code']['coding'][0].display);
          medication += 1;
          callback();

        });

      }, function(medicationDispenseDataError) {

        utils.callFHIRServer("Condition", "subject=" + patientID, function(conditionData) {

          var problem = 1;

          JSON.parse(conditionData).entry.forEach(function(condition) {

            patientHeaders.push("problem" + problem)
            problem += 1;
            patientRow.push(condition.resource.code.coding[0].display);

          });

          callback(patientHeaders, patientRow);

        });

      });

    });

  });

}

function sendAlert(response, alertField, alertValue, callback) {

  var minutesSinceLastAlert = Number.MAX_SAFE_INTEGER;

  if ( lastAlert ) {

    minutesSinceLastAlert = Math.floor(((new Date().getTime() - lastAlert.getTime()) / 1000) / 60);

  }

  // TODO: Miner response is oddly nested.
  minerResponse = JSON.parse(response.body[0]);

  // TODO: Generic term that indicates the issue, and potentially indicates which dialogue to start.
  if ( response.body && minerResponse[0][alertField].indexOf(alertValue) > -1 && minutesSinceLastAlert > config.MAX_ALERT_PERIOD) {

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
          callback(200);

       } else {

          console.log(error);
          callback(400);

       }

     });

   } else {

     callback(200);

   }

}

function processObservation(req, res, callback) {

  observationHeaders = [];
  observationRow = [];

  const patientID = req.body.subject.reference.replace("Patient/", "");

  // Get patient stats
  observationHeaders.push("pid");
  observationRow.push(patientID);

  getPatientStats(patientID, function(patientHeaders, patientRow) {

    // Get observation stats
    req.body.component.forEach(function(measure) {

      // 'c' added (code) as in R colum name references cannot be numerical (bad practice too).
      const code = "c" + measure["code"].coding[0].code;
      const value = measure["valueQuantity"].value;
      observationHeaders.push(code);
      observationRow.push(value);
      populateProvenanceTemplateBP(patientID, code, value, function(response) {});

    });

    callback(observationHeaders, observationRow, patientHeaders, patientRow);

  });

}

router.put('/:id', function(req, res, next) {

  // Use code to determine type of observation.
  if ( req.body.code.coding[0].code == config.HR_CODE ) {

    processObservation(req, res, function(observationHeaders, observationRow, patientHeaders, patientRow) {

      request.post(config.DATA_MINER_URL + "/check/hr", {
        json: {
          "hr": observationHeaders.toString() + "\n" + observationRow.toString(),
          "nn": "7",
          "ehr": patientHeaders.toString() + "\n" + patientRow.toString()
        },
      },
      function (error, response, body) {

        console.log("Data miner: " + response.statusCode);

        if (!error && response.statusCode == 200) {

          console.log(response);

        } else {

          console.log(error);
          res.sendStatus(400);

        }

      });

    });

  } else if (req.body.code.coding[0].code == config.BP_CODE) {

    processObservation(req, res, function(observationHeaders, observationRow, patientHeaders, patientRow) {

      request.post(config.DATA_MINER_URL + "/check/bp", {
        json: {
          "bp": observationHeaders.toString() + "\n" + observationRow.toString(),
          "nn": "7",
          "ehr": patientHeaders.toString() + "\n" + patientRow.toString()
        },
      },
      function (error, response, body) {

        console.log("Data miner: " + response.statusCode);

        if (!error && response.statusCode == 200) {

          sendAlert(response, "bp.trend", "Raised", function(status) {

            res.sendStatus(status);

          });

        } else {

          console.log(error);
          res.sendStatus(400);

        }

      });

    });

  }

});

/**
 * @api {get} /:patientID/:code/:start/:end Request User information
 * @apiName GetObservations
 * @apiGroup Observations
 *
 * @apiParam {Number} patientID Users unique ID.
 * @apiParam {Number} code The code of the observation being requested (e.g. Blood pressure: 85354-9).
 * @apiParam {Number} start The start time of the range of observations to look for, as full timestamp (e.g. 2019-02-26T00:00:00Z).
 * @apiParam {Number} end The end time of the range of observations to look for, as full timestamp (e.g. 2019-02-26T00:00:00Z).
 *
 * @apiSuccess {String} response A list of observation data as an R-formatted table.
 */
router.get('/:patientID/:code/:start/:end', function(req, res, next) {

  utils.callFHIRServer("Observation", "subject=" + req.params.patientID + "&code=" + req.params.code + "&_lastUpdated=gt" + req.params.start + "&_lastUpdated=lt" + req.params.end + "&_count=10000", function(data) {

    header = [];
    rows = "";

    if ( data && JSON.parse(data).entry ) {

      JSON.parse(data).entry.forEach(function(resource) {

        components = [];

        if ( resource.resource.component ) {

          components = resource.resource.component;

        } else if ( resource.resource.valueQuantity ) {

          components.push(resource.resource);

        }

        resourceTime = new Date(resource.resource.effectiveDateTime);

        row = [];

        components.forEach(function(component) {

          var code = component.code.coding[0].code;
          var formattedCode = "\"c" + code.replace("-", "_") + "\"";
          var value = component.valueQuantity.value;

          if ( !header.includes(formattedCode) ) header.push(formattedCode);

          row.push(value);

        });

        row.push(resourceTime.toISOString().split('T')[0]);
        row.push(resourceTime.toISOString().split('T')[0].substring(0, 8) + "01");
        row.push("\"" + utils.dayOfWeekAsString(resourceTime.getDay()) + "\"");
        rows += row + "\n";

      });

      header.push("\"datem\"");
      header.push("\"date.month\"");
      header.push("\"weekday\"\n");

      res.send(utils.replaceAll(header.toString(), ",", " ") + utils.replaceAll(rows.toString(), ",", " "));

    } else {

      res.sendStatus(404);

    }

  });

});

module.exports = router;
