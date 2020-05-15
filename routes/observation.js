const express = require('express');
const router = express.Router();
const request = require('request');
const async = require('async');
const fs = require('fs');
const { v1: uuidv1 } = require('uuid');
const config = require('config');
const logger = require('../config/winston');

const provenance = require('../lib/provenance');
const patient = require('../lib/patient');
const template = require('../lib/template');
const utils = require('../lib/utils');
const fhir = require('../lib/fhir');

let lastAlert = 0;

function registerTemplate(port, documentId, templateId, fragmentId, fragment, callback) {

  provenance.registerTemplate(documentId, templateId, port, function(registerBody) {

    provenance.generate(documentId, templateId, fragmentId, fragment, port, function(generateBody) {

      callback(generateBody);

    });

  });

}

function populateProvenanceTemplate(type, pid, code, value, port, callback) {

  var ID = uuidv1();

  const templatePath = "provenance-templates/json/sensor.json";
  const templateId = "template-sensor";
  const documentId = "document-" + ID;
  const fragmentId = "fragment-" + ID;

  const device = "Blood pressure sensor"
  const company = "Nokia"

  var fragmentData = {
    "var:patient": ":PATIENT_" + pid,
    "vvar:deviceName": ":" + device,
    "vvar:patientID": ":" + pid,
    "vvar:companyName": ":" + company,
    "var:sensorReading": ":SENSOR_READING_" + ID,
    "vvar:sensorReading": ":" + value,
    "var:collectReading": ":COLLECT_READING_" + ID,
    "vvar:readingType": ":" + code
  }

  var fragment = template.createFragmentFromTemplate(templatePath, fragmentData);

  provenance.new(documentId, 'https://kclhi.org.uk/', port, function(newBody) {

    provenance.namespace(documentId, 'snomed', 'http://snomed.info/sct', port, function(namespaceBody) {

      provenance.listDocuments(port, function(documents) {

        if ( documents.indexOf(templateId) < 0 ) {

          const templateDocument = fs.readFileSync(templatePath, 'utf8');
          provenance.newTemplate(templateId, templateDocument, port, function(templateCreation) {

            registerTemplate(port, documentId, templateId, fragmentId, fragment, callback);

          });

        } else {

          registerTemplate(port, documentId, templateId, fragmentId, fragment, callback);

        }

      });

    });

  });

}

function populateProvenanceTemplate_NRChain(type, pid, code, value, session, callback) {

  if ( config.get("provenance_server.NR_MECHANISMS").indexOf("chain") < 0 ) { callback(); return; }

  var POPULATE_START_NR_CHAIN = Date.now();

  populateProvenanceTemplate(type, pid, code, value, config.get("provenance_server.NR_CHAIN_URL_PORT"), function(body) {

    logger.info("Added provenance entry (NR: chain)");
    logger.experiment( session + ": chain," + ( Date.now() - POPULATE_START_NR_CHAIN ) );
    callback(body);

  });

}

function populateProvenanceTemplate_NRBucket(type, pid, code, value, session, callback) {

  if ( config.get("provenance_server.NR_MECHANISMS").indexOf("bucket") < 0 ) { callback(); return; }

  var POPULATE_START_NR_BUCKET = Date.now();

  populateProvenanceTemplate(type, pid, code, value, config.get("provenance_server.NR_BUCKET_URL_PORT"), function(body) {

    logger.info("Added provenance entry (NR: bucket)");
    logger.experiment( session + ": bucket," + ( Date.now() - POPULATE_START_NR_BUCKET ) );
    callback(body);

  });

}

function populateProvenanceTemplate_NRSelinux(type, pid, code, value, session, callback) {

  if ( config.get("provenance_server.NR_MECHANISMS").indexOf("selinux") < 0 ) { callback(); return; }

  var POPULATE_START_NR_SELINUX = Date.now();

  populateProvenanceTemplate(type, pid, code, value, config.get("provenance_server.NR_SELINUX_URL_PORT"), function(body) {

    logger.info("Added provenance entry (NR: selinux)");
    logger.experiment( session + ": selinux," + ( Date.now() - POPULATE_START_NR_SELINUX ) );
    callback(body);

  });

}

function getFHIRServer(query, params, callback) {

  utils.getFHIRServer(query, params, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

}

function sendAlert(response, patientID, dialogueID, alertField, alertValue, readingCode, callback) {

  var minutesSinceLastAlert = Number.MAX_SAFE_INTEGER;

  if ( lastAlert ) minutesSinceLastAlert = Math.floor(((new Date().getTime() - lastAlert.getTime()) / 1000) / 60);

  // TODO: Miner response is oddly nested.
  if ( response.body && response.body[0] && ( minerResponse = utils.JSONParseWrapper(response.body[0]) ) ) {

    if ( ( alertFieldData = utils.validPath(minerResponse, ["0", alertField]) ) && ( reading = utils.validPath(minerResponse, ["0", readingCode]) ) && ( alertFieldData == alertValue ) && ( minutesSinceLastAlert > config.get('dialogue_manager.MAX_ALERT_PERIOD') ) ) {

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

          logger.info("Message passer instructed dialogue manager to initiate alert (dialogue: " + dialogueID + ") with user.")
          lastAlert = new Date();
          callback(200);

        } else {

          logger.error("Could not contact the dialogue manager. " + error + " " + ( response && response.body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ) + " " + ( response && response.statusCode ? response.statusCode : "" ));
          callback(400);

        }

      });

    } else {

      logger.info("Did not alert on miner response. Alert field: " + alertField + ". Data in alert field: " + alertFieldData + ". Alert value: " + alertValue + ". Minutes since last alert: " + minutesSinceLastAlert + ". Max alert period: " + config.get('dialogue_manager.MAX_ALERT_PERIOD') + ". Reading: " + reading);
      callback(200);

    }

  } else {

    logger.error("Could not parse response from data miner.");
    callback(400);

    patientHeaders.push("birthDate");
    patientRow.push(JSON.parse(patientData).birthDate);

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

  var observationHeaders = [];
  var observationRow = [];

  if (patientID = utils.validPath(req, ["body", "subject", "reference"])) {

    patientID = patientID.replace("Patient/", "");

    // Get patient stats
    observationHeaders.push("pid");
    observationRow.push(patientID);

    patient.getPatientStats(patientID, function(patientHeaders, patientRow) {

      if ( patientHeaders.length > 0 && patientRow.length > 0 ) {

        if ( measures = utils.validPath(req, ["body", "component"]) ) {

          // Get observation stats
          async.eachSeries(measures, function(measure, next) {

            // 'c' prefix added (code) as in R colum name references cannot be numerical (bad practice too). Any hypens also removed.
            const code = "c" + measure["code"].coding[0].code.replace("-", "h");
            const value = measure["valueQuantity"].value;
            observationHeaders.push(code);
            observationRow.push(value);

            if ( config.get('provenance_server.TRACK') ) {

              var session = uuidv1();

              populateProvenanceTemplate_NRChain(type, patientID, code, value, session, function(body) {

                populateProvenanceTemplate_NRBucket(type, patientID, code, value, session, function(body) {

                  populateProvenanceTemplate_NRSelinux(type, patientID, code, value, session, function(body) {

                    next(null, null);

                  });

                });

              });

            } else {

              logger.warn("Not tracking provenance.");
              next();

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

              sendAlert(response, patientID.replace("Patient/", ""), "2-1-initiate", "res.c271649006", ["Amber Flag"], "c271649006", function(sbpStatus) {

                sendAlert(response, patientID.replace("Patient/", ""), "2-1-initiate", "res.c271650006", ["Amber Flag"], "c271650006", function(dbpStatus) {

                  sendAlert(response, patientID.replace("Patient/", ""), "2-2-initiate", "res.c271649006", ["Red Flag"], "c271649006", function(sbpStatus) {

                    sendAlert(response, patientID.replace("Patient/", ""), "2-2-initiate", "res.c271650006", ["Red Flag"], "c271650006", function(dbpStatus) {

                      sendAlert(response, patientID.replace("Patient/", ""), "2-3-initiate", "res.c271649006", ["Double Red Flag"], "c271649006", function(sbpStatus) {

                        sendAlert(response, patientID.replace("Patient/", ""), "2-3-initiate", "res.c271650006", ["Double Red Flag"], "c271650006", function(dbpStatus) {

                          res.sendStatus(Math.min(sbpStatus, dbpStatus));

                        });

                      });

                    });

                  });

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
    res.sendStatus(200);

  } else if ( utils.validPath(req, ["body", "code", "coding", "0", "code"]) === config.get('terminology.MOOD_CODE') ) {

    res.sendStatus(200);

  } else {

    utils.noParse("observation type", ["body", "code", "coding", "0", "code"], req);
    res.sendStatus(400);

  }

});

/**
 * @api {get} /Observation/:patientID/:code/:start/:end Request patient vitals (Observation) information
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
    getFHIRServer("Observation", "subject=" + req.params.patientID + "&code=" + req.params.code + "&date=gt" + req.params.start + "&date=lt" + req.params.end + "&_count=10000", function(data) {

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

            var code, valueQuantity, valueSampledData, valueString;

            if ( code = utils.validPath(component, ["code", "coding", "0", "code"]) ) {

              // Because if quantity if 0, will be matched as false without strict equality.
              if ( ( ( valueQuantity = utils.validPath(component, ["valueQuantity", "value"]) ) !== false ) || ( ( valueSampledData = utils.validPath(component, ["valueSampledData", "data"]) ) !== false ) || ( ( valueString = utils.validPath(component, ["valueString"]) ) !== false ) ) {

                var formattedCode = "\"c" + code.replace("-", "h") + "\"";

                if ( !header.includes(formattedCode) ) header.push(formattedCode);

                if ( valueQuantity !== false ) {

                  row.push("\"" + valueQuantity + "\"");

                } else if ( valueSampledData !== false ) {

                  row.push("\"" + valueSampledData + "\"");

                } else if ( valueString !== false ) {

                  row.push("\"" + valueString + "\"");

                }

              } else {

                if (!valueQuantity) utils.noParse("sensor code (input " + req.params.code + ")", ["valueQuantity", "value"], component);
                if (!valueSampledData) utils.noParse("sensor code (input " + req.params.code + ")", ["valueSampledData", "data"], component);
                if (!valueString) utils.noParse("sensor code (input " + req.params.code + ")", ["valueString"], component);

              }

            } else {

              utils.noParse("sensor value (input " + req.params.code + ")", ["code", "coding", "0", "code"], component);

            }

          });

          if ( resource.resource ) {

            row = addDateRows(resource.resource, row);

          } else {

            logger.error("Could not parse resource." + ( ( resource.resource && typeof resource.resource === "object" ) ? JSON.stringify(resource.resource).substring(0, 300) : resource.resource));

          }

          rows += row + "\n";

        });

        header.push("\"datem\"");
        header.push("\"date.month\"");
        header.push("\"time\"");
        header.push("\"weekday\"\n");
        res.send(utils.replaceAll(header.toString(), ",", " ") + utils.replaceAll(rows.toString(), ",", " "));
        return;

      } else {

        logger.error("Could not parse FHIR server response: " + ( data ? data : ""));
        res.sendStatus(400);
        return;

      }

      res.send(utils.replaceAll(header.toString(), ",", " ") + utils.replaceAll(rows.toString(), ",", " "));

    });

  } else {

    res.sendStatus(400);

  }

});

function createObservationResource(template, data, callback) {

  fhir.createObservationResource(config.get('fhir_server.URL'), config.get('fhir_server.REST_ENDPOINT'), template, data, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

}

/**
 * @api {post} /Observation/add Add new Observation resource (e.g. patient mood).
 * @apiName Add
 * @apiGroup Observations
 *
 * @apiParam {String} id Resource ID (Optional).
 * @apiParam {String} subjectReference Patient ID.
 * @apiParam {String} effectiveDateTime (Optional) Timestamp of (mood) observation.
 * @apiParam {String} 285854004 Recorded emotion.
 *
 * @apiSuccess {String} Resource added.
 */
router.post('/add', function(req, res, next) {

  createObservationResource("mood", req.body, function(status) { res.sendStatus(status); });

});

module.exports = router;
