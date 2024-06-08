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

  resourceTime = new Date(resource.authored);
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
 * @apiParam {String} id (Optional) Resource ID.
 * @apiParam {String} subjectReference Patient ID.
 * @apiParam {String} effectiveDateTime (Optional) Timestamp of response
 * @apiParam {String} LittleInterestInitial (Optional, if PHQ9) PHQ2 yes/no for LittleInterest
 * @apiParam {String} FeelingDownInitial (Optional, if PHQ9) PHQ2 yes/no for FeelingDown
 * @apiParam {String} LittleInterest (Optional, if PHQ2) PHQ9 score for LittleInterest
 * @apiParam {String} FeelingDown (Optional, if PHQ2) PHQ9 score for FeelingDown
 * @apiParam {String} TroubleSleeping (Optional, if PHQ2) PHQ9 score for TroubleSleeping
 * @apiParam {String} FeelingTired (Optional, if PHQ2) PHQ9 score for FeelingTired
 * @apiParam {String} BadAppetite (Optional, if PHQ2) PHQ9 score for BadAppetite
 * @apiParam {String} FeelingBadAboutSelf (Optional, if PHQ2) PHQ9 score for FeelingBadAboutSelf
 * @apiParam {String} TroubleConcentrating (Optional, if PHQ2) PHQ9 score for TroubleConcentrating
 * @apiParam {String} MovingSpeaking (Optional, if PHQ2) PHQ9 score for MovingSpeaking
 * @apiParam {String} ThoughtsHurting (Optional, if PHQ2) PHQ9 score for ThoughtsHurting
 * @apiParam {String} Difficulty (Optional, if PHQ2) PHQ9 score for Difficulty
 * @apiParam {String} TotalScore (Optional, if PHQ2) Total PHQ9 score
 *
 * @apiSuccess {String} Confirmation Resource added.
 */
router.post('/add', function(req, res, next) {

  // Set PHQ2 scores to 0 if not supplied. TODO: Differentiate between doesn't apply (e.g. PHQ9) and not answered.
  if ( !req.body.LittleInterestInitial ) req.body.LittleInterestInitial = "No";
  if ( !req.body.FeelingDownInitial ) req.body.FeelingDownInitial = "No";

  // PHQ9
  var totalScore = 0;
  const PHQ9Fields = ["LittleInterest", "FeelingDown", "TroubleSleeping", "FeelingTired", "BadAppetite", "FeelingBadAboutSelf", "TroubleConcentrating", "MovingSpeaking", "ThoughtsHurting", "Difficulty"];
  const PHQ9Scores = {"Not at all": 0, "Several days": 1, "More than half the days": 2, "Nearly every day": 3};

  PHQ9Fields.forEach(function(PHQ9field) {

    if ( req.body[PHQ9field] ) {

      // If an answer is provided rather than a score, determine what the score is.
      if ( typeof req.body[PHQ9field] != "number" ) {

        if ( PHQ9Scores[req.body[PHQ9field]] !== false ) {

          // Convert answer to numeric equivalent.
          req.body[PHQ9field] = PHQ9Scores[req.body[PHQ9field]];

        } else {

          logger.error("Examining field " + PHQ9field + ". Could not find PHQ9 score for response: " + req.body[PHQ9field]);

        }

      }

      // Sum up scores if total score not provided
      if ( !req.body.TotalScore ) {

        totalScore += req.body[PHQ9field];

      }

    } else {

      // Set field to -1 if not supplied (e.g. if PHQ2 response)
      req.body[PHQ9field] = -1;

    }

  });

  if ( !req.body.TotalScore ) req.body.TotalScore = totalScore;

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
    getFHIRServer("QuestionnaireResponse", "subject=" + req.params.patientID + "&authored=gt" + req.params.start + "&authored=lt" + req.params.end + "&_sort=-date&_count=10000", function(data) {

      header = [];
      rows = "";

      if ( data && ( parsedData = utils.JSONParseWrapper(data) ) && parsedData.entry ) {

        parsedData.entry.forEach(function(resource) {

          row = [];

          if ( items = utils.validPath(resource, ["resource", "item"]) ) {

            items.forEach(function(item) {

              if ( linkId = utils.validPath(item, ["linkId"]) ) {

                if ( responseCode = utils.validPath(item, ["answer", 0, "valueCoding", "code"]) ) {

                  row.push("\"" + responseCode + "\"");

                }

                if ( ( responseInteger = utils.validPath(item, ["answer", 0, "valueInteger"]) ) !== false ) {

                  row.push("\"" + responseInteger + "\"");

                }

                if ( responseCode || responseInteger || responseInteger === 0 ) {

                  if ( !header.includes("\"" + linkId + "\"") ) header.push("\"" + linkId + "\"");

                } else {

                  logger.error("No associated QuestionnaireResponse value for " + linkId);

                }

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
