const express = require('express');
const router = express.Router();
const request = require('request');
const async = require('async');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const config = require('config');
const logger = require('../config/winston');

const provenance = require('../lib/provenance');
const utils = require('../lib/utils');

let lastAlert = 0;

function populateProvenanceTemplateBP(pid, code, value, callback) {

  var document = fs.readFileSync('provenance-templates/template-bp-fragment.json', 'utf8');
  document = document.replace("[pid]", pid);
  document = document.replace("[company]", "Nokia");
  document = document.replace("[code]", code);
  document = document.replace("[value]", value);

  provenance.add(uuidv1(), document, "template-bp", "provenance-templates/template-bp.json", function(response) { callback(response); });

}

function getPatientStats(patientID, callback) {

  patientHeaders = [];
  patientRow = [];

  utils.callFHIRServer("Patient/" + patientID, "", function(patientData) {

    if ( parsedPatientData = utils.JSONParseWrapper(patientData) ) {

      if ( birthDate = parsedPatientData.birthDate ) {

        patientHeaders.push("birthDate");
        patientRow.push(birthDate);

        if ( ethnicity = utils.validPath(parsedPatientData, ["extension", "0", "extension", "0", "valueCoding", "display"] ) ) {

          patientHeaders.push("ethnicity");
          patientRow.push(ethnicity);

          utils.callFHIRServer("MedicationDispense", "subject=" + patientID, function(medicationDispenseData) {

            if ( ( parsedMedicationDispenseData = utils.JSONParseWrapper(medicationDispenseData) ) && parsedMedicationDispenseData.entry ) {

              // TODO: Remove async.
              async.each(parsedMedicationDispenseData.entry, function(medicationDispense, done) {

                if ( medicationReference = utils.validPath(medicationDispense, ["resource", "medicationReference", "reference"]) ) {

                  utils.callFHIRServer(medicationReference, "", function(medicationData) {

                    if ( ( parsedMedicationData = utils.JSONParseWrapper(medicationData) ) && ( medicationName = utils.validPath(parsedMedicationData, ["code", "coding", "0", "display"]) ) ) {

                      patientHeaders.push("medication" + (parsedMedicationDispenseData.entry.findIndex(jsonObject => jsonObject.fullUrl == medicationDispense.fullUrl) + 1));
                      patientRow.push(medicationName);
                      done();

                    } else {

                      utils.noParse("medication name", ["code", "coding", "0", "display"], medicationData);
                      done();

                    }

                  });

                } else {

                  utils.noParse("medication reference", ["resource", "medicationReference", "reference"], medicationDispense);
                  done();

                }

              }, function(medicationDispenseDataError) {

                utils.callFHIRServer("Condition", "subject=" + patientID, function(conditionData) {

                  var problem = 1;

                  if ( ( parsedConditionData = utils.JSONParseWrapper(conditionData) ) && parsedConditionData.entry ) {

                    parsedConditionData.entry.forEach(function(condition) {

                      if ( conditionName = utils.validPath(condition, ["resource", "code", "coding", "0", "display"]) ) {

                        patientHeaders.push("problem" + problem)
                        problem += 1;
                        patientRow.push(conditionName);

                      } else {

                        utils.noParse("condition data", ["resource", "code", "coding", "0", "display"], conditionData);
                        callback(patientHeaders, patientRow);

                      }

                    });

                  }

                  callback(patientHeaders, patientRow);

                });

              });

            } else {

              utils.noParse("medication dispense data", [], medicationDispenseData);
              callback(patientHeaders, patientRow);

            }

          });

        } else {

          utils.noParse("patient ethnicity", ["extension", "0", "extension", "0", "valueCoding", "display"], patientData);
          callback(patientHeaders, patientRow);

        }

      } else {

        utils.noParse("patient birth date", [], patientData);
        callback(patientHeaders, patientRow);

      }

    } else {

      utils.noParse("patient data", [], patientData);
      callback(patientHeaders, patientRow);

    }

  });

}

function sendAlert(response, patientID, alertField, alertValue, callback) {

  var minutesSinceLastAlert = Number.MAX_SAFE_INTEGER;

  if ( lastAlert ) minutesSinceLastAlert = Math.floor(((new Date().getTime() - lastAlert.getTime()) / 1000) / 60);

  // TODO: Miner response is oddly nested.
  if ( response.body && response.body[0] && ( minerResponse = utils.JSONParseWrapper(response.body[0]) ) ) {

    if ( ( alertFieldData = utils.validPath(minerResponse, ["0", alertField]) ) && alertFieldData.indexOf(alertValue) > -1 && minutesSinceLastAlert > config.get('dialogue_manager.MAX_ALERT_PERIOD') ) {

      request({

        method: "POST",
        url: config.get('dialogue_manager.URL') + "/initiate",
        headers: {

         "Authorization": "Basic " + new Buffer(config.get('credentials.USERNAME') + ":" + config.get('credentials.PASSWORD')).toString("base64")

        },
        json: {

         // TODO: Something from the data miner response that indicates which dialogue to initiate.
         "dialogueID": "2",
         // TODO: Assume username on chat is the same as Patient ID in FHIR or query a service storing a mapping between the two.
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

      logger.info("Did not alert on miner response. Alert field: " + alertField + ". Alert value: " + alertValue + ". Minutes since last alert: " + minutesSinceLastAlert + ". Max alert period: " + config.get('dialogue_manager.MAX_ALERT_PERIOD'));
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

function processObservation(req, res, callback) {

  observationHeaders = [];
  observationRow = [];

  if (patientID = utils.validPath(req, ["body", "subject", "reference"])) {

    patientID = patientID.replace("Patient/", "");

    // Get patient stats
    observationHeaders.push("pid");
    observationRow.push(patientID);

    getPatientStats(patientID, function(patientHeaders, patientRow) {

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

              populateProvenanceTemplateBP(patientID, code, value, function(body) {

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

    processObservation(req, res, function(observationHeaders, observationRow, patientHeaders, patientRow) {

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

            logger.error(error + " " + ( response && response.statusCode ? response.statusCode : "" ) + " " + ( body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ));
            res.sendStatus(400);

          }

        });

      } else {

        logger.error("Missing observation or patient headers.")
        res.sendStatus(400);

      }

    });

  } else if ( utils.validPath(req, ["body", "code", "coding", "0", "code"]) === config.get('terminology.BP_CODE') ) {

    processObservation(req, res, function(observationHeaders, observationRow, patientHeaders, patientRow) {

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

              // TODO: Generic term that indicates the issue, and potentially indicates which dialogue to start.
              sendAlert(response, patientID.replace("Patient/", ""), "bp.trend", "Red", function(status) {

                res.sendStatus(status);

              });

            } else {

              utils.noParse("patient ID", ["body", "subject", "reference"], req);
              res.sendStatus(400);

            }

          } else {

            logger.error(error + " " + ( response && response.statusCode ? response.statusCode : "" ) + " " + ( body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ));
            res.sendStatus(400);

          }

        });

      } else {

        logger.error("Missing observation or patient headers.")
        res.sendStatus(400);

      }

    });

  } else {

    utils.noParse("observation type", ["body", "code", "coding", "0", "code"], req);
    res.sendStatus(400);

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

  if ( req.params && req.params.patientID && req.params.code && req.params.start && req.params.end ) {

    // TODO: Ensure highest count.
    utils.callFHIRServer("Observation", "subject=" + req.params.patientID + "&code=" + req.params.code + "&_lastUpdated=gt" + req.params.start + "&_lastUpdated=lt" + req.params.end + "&_count=10000", function(data) {

    header = [];
    rows = "";

    if ( data && ( parsedData = utils.JSONParseWrapper(data) ) && parsedData.entry ) {

      parsedData.entry.forEach(function(resource) {

        components = [];

        // Handle single vs. multiple responses.
        if ( utils.validPath(resource, ["resource", "component"]) ) {

          components = resource.resource.component;

        } else if ( utils.validPath(resource, ["resource", "valueQuantity"]) ) {

          components.push(resource.resource);

        }

        row = [];

        components.forEach(function(component) {

          var code, value;

          if ( code = utils.validPath(component, ["code", "coding", "0", "code"]) ) {

            if ( value = utils.validPath(component, ["valueQuantity", "value"]) ) {

              var formattedCode = "\"c" + code.replace("-", "h") + "\"";

              if ( !header.includes(formattedCode) ) header.push(formattedCode);

              row.push(value);

            } else {

              utils.noParse("sensor code", ["code", "coding", "0", "code"], component);

            }

          } else {

            utils.noParse("sensor value", ["valueQuantity", "value"], component);

          }

        });

        if ( resource.resource ) {

          row = addDateRows(resource.resource, row);

        } else {

          logger.error("Could not parse resource." + (typeof  resource.resource === "object" ? JSON.stringify(resource.resource) : resource.resource));

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
