const express = require('express');
const router = express.Router();
const config = require('config');

const utils = require('../lib/utils');
const fhir = require('../lib/fhir');
const logger = require('../config/winston');

function createAuditEvent(template, data, callback) {

  fhir.createAuditEventResource(config.get('fhir_server.URL'), config.get('fhir_server.REST_ENDPOINT'), template, data, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

}

function getFHIRServer(query, params, callback) {

  utils.getFHIRServer(query, params, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

}

function addDateRows(resource, row) {

  resourceTime = new Date(resource.recorded);
  row.push(resourceTime.toISOString().split('T')[0]);
  row.push(resourceTime.toISOString().split('T')[0].substring(0, 8) + "01");
  row.push(resourceTime.toISOString().split('T')[1].substring(0, resourceTime.toISOString().split('T')[1].indexOf(".")));
  row.push("\"" + utils.dayOfWeekAsString(resourceTime.getDay()) + "\"");
  return row;

}

/**
 * @api {post} /AuditEvent/add Add new AuditEvent (e.g. dashboard event).
 * @apiName Add
 * @apiGroup AuditEvents
 *
 * @apiParam {String} id Resource ID (optional)
 * @apiParam {String} subjectReference Patient ID
 * @apiParam {String} eventType Type of event
 * @apiParam {String} eventData Data associated with event
 * @apiParam {String} effectiveDateTime (optional) Timestamp of event
 *
 * @apiSuccess {String} Confirmation Resource added.
 */
router.post('/add', function(req, res, next) {

  createAuditEvent("event", req.body, function(status) { res.sendStatus(status); });

});

/**
 * @api {get} /AuditEvent/:patientID/:start/:end Request event (AuditEvent) information
 * @apiName GetAuditEvent
 * @apiGroup AuditEvents
 *
 * @apiParam {Number} patientID Users unique ID.
 * @apiParam {Number} start The start time of the range of events to look for, as full timestamp (e.g. 2019-02-26T00:00:00Z).
 * @apiParam {Number} end The end time of the range of events to look for, as full timestamp (e.g. 2019-02-26T00:00:00Z).
 *
 * @apiSuccess {String} response A list of event data as an R-formatted table.
 */
router.get('/:patientID/:start/:end', function(req, res, next) {

  if ( req.params && req.params.patientID && req.params.start && req.params.end ) {

    // TODO: Ensure highest count.
    getFHIRServer("AuditEvent", "patient=" + req.params.patientID + "&date=gt" + req.params.start + "&date=lt" + req.params.end + "&_sort=-date&_count=10000", function(data) {

      header = [];
      rows = "";

      if ( data && ( parsedData = utils.JSONParseWrapper(data) ) && parsedData.entry ) {

        parsedData.entry.forEach(function(resource) {

          row = [];

          if ( eventType = utils.validPath(resource, ["resource", "source", "site"]) ) {

            row.push("\"" + eventType + "\"");

          }

          if ( eventData = utils.validPath(resource, ["resource", "entity", "0", "description"]) ) {

            row.push("\"" + eventData + "\"");

          }

          if ( resource.resource ) {

            row = addDateRows(resource.resource, row);

          } else {

            logger.error("Could not parse resource." + ( ( resource.resource && typeof resource.resource === "object" ) ? JSON.stringify(resource.resource).substring(0, 300) : resource.resource));

          }

          rows += row + "\n";

        });

        header.push("\"type\"");
        header.push("\"data\"");
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

module.exports = router;
