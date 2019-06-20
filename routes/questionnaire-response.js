const express = require('express');
const router = express.Router();
const config = require('config');

const utils = require('../lib/utils');
const fhir = require('../lib/fhir');

function createQuestionnaireResponseResource(template, data, callback) {

  fhir.createQuestionnaireResponseResource(config.get('fhir_server.URL'), config.get('fhir_server.REST_ENDPOINT'), template, data, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

}

/**
 * @api {post} /QuestionnaireResponse/add
 * @apiName Add
 * @apiGroup QuestionnaireResponses
 *
 * @apiParam {String}
 * @apiParam {String}
 *
 * @apiSuccess {String}
 */
router.post('/add', function(req, res, next) {

  createQuestionnaireResponseResource("PHQ9", req.body, function(status) { res.sendStatus(status); });

});

module.exports = router;
