const express = require('express');
const router = express.Router();
const request = require('request');
const async = require('async');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const config = require('config');
const logger = require('../config/winston');

const provenance = require('../lib/provenance');
const patient = require('../lib/patient');
const utils = require('../lib/utils');

let lastAlert = 0;

function populateProvenanceTemplate(type, pid, code, value, callback) {

  var document = fs.readFileSync('provenance-templates/template-sensor-fragment.json', 'utf8');
  document = document.replace("[pid]", pid);
  document = document.replace("[company]", config.get('companies.' + type));
  document = document.replace("[code]", code);
  document = document.replace("[value]", value);

  provenance.add(uuidv1(), document, "template-sensor", "provenance-templates/template-sensor.json", function(response) { callback(response); });

}

function callFHIRServer(query, params, callback) {

  utils.callFHIRServer(query, params, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

}

function sendAlert(response, patientID, dialogueID, alertField, alertValues, readingCode, callback) {

  var minutesSinceLastAlert = Number.MAX_SAFE_INTEGER;

  if ( lastAlert ) minutesSinceLastAlert = Math.floor(((new Date().getTime() - lastAlert.getTime()) / 1000) / 60);

  // TODO: Miner response is oddly nested.
  if ( response.body && response.body[0] && ( minerResponse = utils.JSONParseWrapper(response.body[0]) ) ) {

    if ( ( alertFieldData = utils.validPath(minerResponse, ["0", alertField]) ) && ( reading = utils.validPath(minerResponse, ["0", readingCode]) ) && ( new RegExp(alertValues.join("|")).test(alertFieldData) ) && ( minutesSinceLastAlert > config.get('dialogue_manager.MAX_ALERT_PERIOD') ) ) {

      var dialogueParams = {};
      dialogueParams.ALERT_READING = reading;

      request({

        method: "POST",
        url: config.get('dialogue_manager.URL') + "/initiate",
        headers: {

         "Authorization": "Basic " + new Buffer(config.get('credentials.USERNAME') + ":" + config.get('credentials.PASSWORD')).toString("base64")

        },
        json: {

         "dialogueID": dialogueID,
         "dialogueParams": dialogueParams,
         "username": patientID,

        },
        requestCert: true

      },
      function (error, response, body) {

        if (!error && ( response && response.statusCode == 200 ) ) {

          logger.info("Message passer instructed dialogue manager to initiate alert with user.")
          lastAlert = new Date();
          callback(200);

        } else {

          logger.error("Could not contact the dialogue manager. " + error + " " + ( response && response.body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ) + " " + ( response && response.statusCode ? response.statusCode : "" ));
          callback(400);

        }

      });

    } else {

      logger.info("Did not alert on miner response. Alert field: " + alertField + ". Data in alert field: " + alertFieldData + ". Alert value: " + alertValues + ". Minutes since last alert: " + minutesSinceLastAlert + ". Max alert period: " + config.get('dialogue_manager.MAX_ALERT_PERIOD') + ". Reading: " + reading);
      callback(200);

    }

  } else {

    logger.error("Could not parse response from data miner.");
    callback(400);

  }

}

function addDateRows(resource, row) {

  resourceTime = new Date(resource.effectiveDateTime);
  row.push(resourceTime.toISOString().split('T')[0]);
  row.push(resourceTime.toISOString().split('T')[0].substring(0, 8) + "01");
  row.push(resourceTime.toISOString().split('T')[1].substring(0, resourceTime.toISOString().split('T')[1].indexOf(".")));
  row.push("\"" + utils.dayOfWeekAsString(resourceTime.getDay()) + "\"");
  return row;

}

function processObservation(req, res, type, callback) {

  observationHeaders = [];
  observationRow = [];

  if (patientID = utils.validPath(req, ["body", "subject", "reference"])) {

    patientID = patientID.replace("Patient/", "");

    // Get patient stats
    observationHeaders.push("pid");
    observationRow.push(patientID);

    patient.getPatientStats(patientID, function(patientHeaders, patientRow) {

      if ( patientHeaders.length > 0 && patientRow.length > 0 ) {

        if ( measures = utils.validPath(req, ["body", "component"]) ) {

          // Get observation stats
          async.eachSeries(measures, function(measure, done) {

            // 'c' prefix added (code) as in R colum name references cannot be numerical (bad practice too). Any hypens also removed.
            const code = "c" + measure["code"].coding[0].code.replace("-", "h");
            const value = measure["valueQuantity"].value;
            observationHeaders.push(code);
            observationRow.push(value);

            if ( config.get('provenance_server.TRACK') ) {

              populateProvenanceTemplate(type, patientID, code, value, function(body) {

                logger.info("Added provenance entry.");
                done();

              });

            } else {

              logger.warn("Not tracking provenance.");
              done();

            }

          }, function(provenanceError) {

            observationHeaders.push("datem");
            observationHeaders.push("date.month");
            observationHeaders.push("time");
            observationHeaders.push("weekday");
            observationRow = addDateRows(req.body, observationRow);
            callback(observationHeaders, observationRow, patientHeaders, patientRow);

          });

        } else {

          utils.noParse("measures.", ["body", "component"], req);
          callback(observationHeaders, observationRow, patientHeaders, patientRow);

        }

      } else {

        logger.error("Did not receive patient information.");
        callback(observationHeaders, observationRow, patientHeaders, patientRow);

      }

    });

  } else {

    utils.noParse("patient ID", ["body", "subject", "reference"], req);
    callback(observationHeaders, observationRow, patientHeaders, patientRow);

  }

}

router.put('/:id', function(req, res, next) {

  // Use code to determine type of observation.
  if ( utils.validPath(req, ["body", "code", "coding", "0", "code"]) === config.get('terminology.HR_CODE') ) {

    logger.info("Received HR value.");

    processObservation(req, res, "HR", function(observationHeaders, observationRow, patientHeaders, patientRow) {

      if ( observationHeaders.length > 0 && observationRow.length > 0 && patientHeaders.length > 0 && patientRow.length > 0 ) {

        request.post(config.get('data_miner.URL') + "/check/hr", {

          json: {

            "hr": observationHeaders.toString() + "\n" + observationRow.toString(),
            "nn": "7",
            "ehr": patientHeaders.toString() + "\n" + patientRow.toString()

          },
          requestCert: true

        },
        function (error, response, body) {

          if ( !error && ( response && response.statusCode == 200 ) ) {

            logger.info("Contacted data miner for analysis of heart rate.");
            res.sendStatus(200);

          } else {

            logger.error("Could not contact the data miner: " + error + " " + ( response && response.statusCode ? response.statusCode : "" ) + " " + ( body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ));
            res.sendStatus(400);

          }

        });

      } else {

        logger.error("Missing observation or patient headers.")
        res.sendStatus(400);

      }

    });

  } else if ( utils.validPath(req, ["body", "code", "coding", "0", "code"]) === config.get('terminology.BP_CODE') ) {

    logger.info("Received BP value.");

    processObservation(req, res, "BP", function(observationHeaders, observationRow, patientHeaders, patientRow) {

      if ( observationHeaders.length > 0 && observationRow.length > 0 && patientHeaders.length > 0 && patientRow.length > 0 ) {

        request.post(config.get('data_miner.URL') + "/check/bp", {

          json: {

            "bp": observationHeaders.toString() + "\n" + observationRow.toString(),
            "nn": "7",
            "ehr": patientHeaders.toString() + "\n" + patientRow.toString()

          },
          requestCert: true

        },
        function (error, response, body) {

          if ( !error && ( response && response.statusCode < 400 ) ) {

            logger.info("Contacted data miner for analysis of blood pressure.");

            if (patientID = utils.validPath(req, ["body", "subject", "reference"])) {

              sendAlert(response, patientID.replace("Patient/", ""), 2, "res.c271649006", ["Amber", "Red"], "c271649006", function(sbpStatus) {

                sendAlert(response, patientID.replace("Patient/", ""), 2, "res.c271650006", ["Amber", "Red"], "c271650006", function(dbpStatus) {

                  res.sendStatus(Math.min(sbpStatus, dbpStatus));

                });

              });

            } else {

              utils.noParse("patient ID", ["body", "subject", "reference"], req);
              res.sendStatus(400);

            }

          } else {

            logger.error("Could not contact data miner: " + error + " " + ( response && response.statusCode ? response.statusCode : "" ) + " " + ( body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ));
            res.sendStatus(400);

          }

        });

      } else {

        logger.error("Missing observation or patient headers.")
        res.sendStatus(400);

      }

    });

  } else if ( utils.validPath(req, ["body", "code", "coding", "0", "code"]) === config.get('terminology.ECG_CODE') ) {

    // Process ECG.

  } else {

    utils.noParse("observation type", ["body", "code", "coding", "0", "code"], req);
    res.sendStatus(400);

  }

});

/**
 * @api {get} /:patientID/:code/:start/:end Request patient vitals (Observation) information
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

  if ( req.params && req.params.patientID && req.params.code && req.params.start && req.params.end ) {

    // TODO: Ensure highest count.
    callFHIRServer("Observation", "subject=" + req.params.patientID + "&code=" + req.params.code + "&_lastUpdated=gt" + req.params.start + "&_lastUpdated=lt" + req.params.end + "&_count=10000", function(data) {

      header = [];
      rows = "";

      if ( data && ( parsedData = utils.JSONParseWrapper(data) ) && parsedData.entry ) {

        parsedData.entry.forEach(function(resource) {

          components = [];

          // Handle single vs. multiple responses.
          if ( utils.validPath(resource, ["resource", "component"]) ) {

            components = resource.resource.component;

          } else if ( utils.validPath(resource, ["resource", "valueQuantity"]) || utils.validPath(resource, ["resource", "valueSampledData"]) ) {

            components.push(resource.resource);

          }

          row = [];

          components.forEach(function(component) {

            var code, valueQuantity, valueSampledData;

            if ( code = utils.validPath(component, ["code", "coding", "0", "code"]) ) {

              // Because if quantity if 0, will be matched as false without strict equality.
              if ( ( ( valueQuantity = utils.validPath(component, ["valueQuantity", "value"]) ) !== false ) || ( ( valueSampledData = utils.validPath(component, ["valueSampledData", "data"]) ) !== false ) ) {

                var formattedCode = "\"c" + code.replace("-", "h") + "\"";

                if ( !header.includes(formattedCode) ) header.push(formattedCode);

                row.push("\"" + ( ( valueQuantity && valueQuantity !== false ) ? valueQuantity : valueSampledData ) + "\"");

              } else {

                if (!valueQuantity) utils.noParse("sensor code (input " + req.params.code + ")", ["valueQuantity", "value"], component);
                if (!valueSampledData) utils.noParse("sensor code (input " + req.params.code + ")", ["valueSampledData", "data"], component);

              }

            } else {

              utils.noParse("sensor value (input " + req.params.code + ")", ["code", "coding", "0", "code"], component);

            }

          });

          if ( resource.resource ) {

            row = addDateRows(resource.resource, row);

          } else {

            logger.error("Could not parse resource." + (typeof  resource.resource === "object" ? JSON.stringify(resource.resource).substring(0, 300) : resource.resource));

          }

          rows += row + "\n";

        });

        header.push("\"datem\"");
        header.push("\"date.month\"");
        header.push("\"time\"");
        header.push("\"weekday\"\n");
        res.send(utils.replaceAll(header.toString(), ",", " ") + utils.replaceAll(rows.toString(), ",", " "));

      } else {

        logger.error("Could not parse FHIR server response: " + ( data ? data : ""));
        res.sendStatus(400);

      }

    });

  } else {

    res.sendStatus(400);

  }

});

module.exports = router;
