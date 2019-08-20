const express = require('express');
const router = express.Router();
const config = require('config');

const utils = require('../lib/utils');
const fhir = require('../lib/fhir');
const logger = require('../config/winston');

function createQuestionnaireResponseResource(template, data, callback) {

  fhir.createQuestionnaireResponseResource(config.get('fhir_server.URL'), config.get('fhir_server.REST_ENDPOINT'), template, data, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

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
 * @api {post} /QuestionnaireResponse/add Add new QuestionnaireResponse resource (e.g. PHQ9 depression screening responses).
 * @apiName Add
 * @apiGroup QuestionnaireResponses
 *
 * @apiParam {String} id Resource ID.
 * @apiParam {String} subjectReference Patient ID.
 * @apiParam {String} effectiveDateTime (Optional) Timestamp of response
 * @apiParam {String} LittleInterest PHQ9 score for LittleInterest
 * @apiParam {String} FeelingDown PHQ9 score for FeelingDown
 * @apiParam {String} TroubleSleeping PHQ9 score for TroubleSleeping
 * @apiParam {String} FeelingTired PHQ9 score for FeelingTired
 * @apiParam {String} BadAppetite PHQ9 score for BadAppetite
 * @apiParam {String} FeelingBadAboutSelf PHQ9 score for FeelingBadAboutSelf
 * @apiParam {String} TroubleConcentrating PHQ9 score for TroubleConcentrating
 * @apiParam {String} MovingSpeaking PHQ9 score for MovingSpeaking
 * @apiParam {String} Difficulty PHQ9 score for Difficulty
 * @apiParam {String} TotalScore Total PHQ9 score
 *
 * @apiSuccess {String} Confirmation Resource added.
 */
router.post('/add', function(req, res, next) {

  createQuestionnaireResponseResource("PHQ9", req.body, function(status) { res.sendStatus(status); });

});

/**
 * @api {get} /QuestionnaireResponse/:patientID/:start/:end Request questionnaire response (QuestionnaireResponse) information
 * @apiName GetQuestionnaireResponse
 * @apiGroup QuestionnaireResponses
 *
 * @apiParam {Number} patientID Users unique ID.
 * @apiParam {Number} start The start time of the range of QuestionnaireResponses to look for, as full timestamp (e.g. 2019-02-26T00:00:00Z).
 * @apiParam {Number} end The end time of the range of QuestionnaireResponses to look for, as full timestamp (e.g. 2019-02-26T00:00:00Z).
 *
 * @apiSuccess {String} response A list of questionnaire response data as an R-formatted table.
 */
router.get('/:patientID/:start/:end', function(req, res, next) {

  if ( req.params && req.params.patientID && req.params.start && req.params.end ) {

    // TODO: Ensure highest count.
    getFHIRServer("QuestionnaireResponse", "subject=" + req.params.patientID + "&date=gt" + req.params.start + "&date=lt" + req.params.end + "&_count=10000", function(data) {

      header = [];
      rows = "";

      if ( data && ( parsedData = utils.JSONParseWrapper(data) ) && parsedData.entry ) {

        parsedData.entry.forEach(function(resource) {

          row = [];

          if ( items = utils.validPath(resource, ["item"]) ) {

            items.forEach(function(item) {

              if ( ( linkId = utils.validPath(item, ["linkId"]) ) && ( response = utils.validPath(item, ["answer", "valueCoding", "code"]) ) ) {

                if ( !header.includes(linkId) ) header.push("\"" + linkId + "\"");
                row.push("\"" + response + "\"");

              }

            });

          }

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

module.exports = router;
