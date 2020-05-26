const express = require('express');
const router = express.Router();
const config = require('config');

const utils = require('../lib/utils');
const fhir = require('../lib/fhir');
const logger = require('../config/winston');

function createClinicalImpression(template, data, callback) {

  fhir.createClinicalImpressionResource(config.get('fhir_server.URL'), config.get('fhir_server.REST_ENDPOINT'), template, data, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

}

function getFHIRServer(query, params, callback) {

  utils.getFHIRServer(query, params, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

}

function addDateRows(resource, row) {

  resourceTime = new Date(resource.date);
  row.push(resourceTime.toISOString().split('T')[0]);
  row.push(resourceTime.toISOString().split('T')[0].substring(0, 8) + "01");
  row.push(resourceTime.toISOString().split('T')[1].substring(0, resourceTime.toISOString().split('T')[1].indexOf(".")));
  row.push("\"" + utils.dayOfWeekAsString(resourceTime.getDay()) + "\"");
  return row;

}

/**
 * @api {post} /ClinicalImpression/add Add new ClinicalImpression (e.g. GP notes).
 * @apiName Add
 * @apiGroup ClinicalImpressions
 *
 * @apiParam {String} id Resource ID (optional)
 * @apiParam {String} note Impression details
 * @apiParam {String} subjectReference Patient ID
 * @apiParam {String} effectiveDateTime (optional) Timestamp of impression
 *
 * @apiSuccess {String} Confirmation Resource added.
 */
router.post('/add', function(req, res, next) {

  createClinicalImpression("notes", req.body, function(status) { res.sendStatus(status); });

});

/**
 * @api {get} /ClinicalImpression/:patientID/:start/:end Request GP note (ClinicalImpression) information
 * @apiName GetClinicalImpression
 * @apiGroup ClinicalImpressions
 *
 * @apiParam {Number} patientID Users unique ID.
 * @apiParam {Number} start The start time of the range of observations to look for, as full timestamp (e.g. 2019-02-26T00:00:00Z).
 * @apiParam {Number} end The end time of the range of observations to look for, as full timestamp (e.g. 2019-02-26T00:00:00Z).
 *
 * @apiSuccess {String} response A list of clinical impression data as an R-formatted table.
 */
router.get('/:patientID/:start/:end', function(req, res, next) {

  if ( req.params && req.params.patientID && req.params.start && req.params.end ) {

    // TODO: Ensure highest count.
    getFHIRServer("ClinicalImpression", "subject=" + req.params.patientID + "&date=gt" + req.params.start + "&date=lt" + req.params.end + "&_sort=-date&_count=10000", function(data) {

      header = [];
      rows = "";

      if ( data && ( parsedData = utils.JSONParseWrapper(data) ) && parsedData.entry ) {

        parsedData.entry.forEach(function(resource) {

          row = [];

          if ( utils.validPath(resource, ["resource", "description"]) ) {

            row.push("\"" + resource.resource.description + "\"");

          }

          if ( resource.resource ) {

            row = addDateRows(resource.resource, row);

          } else {

            logger.error("Could not parse resource." + ( ( resource.resource && typeof resource.resource === "object" ) ? JSON.stringify(resource.resource).substring(0, 300) : resource.resource));

          }

          rows += row + "\n";

        });

        header.push("\"note\"");
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
