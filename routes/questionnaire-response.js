const express = require('express');
const router = express.Router();
const config = require('config');

const utils = require('../lib/utils');
const fhir = require('../lib/fhir');

function createQuestionnaireResponseResource(template, data, callback) {

  fhir.createQuestionnaireResponseResource(config.get('fhir_server.URL'), config.get('fhir_server.REST_ENDPOINT'), template, data, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

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

module.exports = router;
