const express = require('express');
const router = express.Router();
const fs = require('fs');
const request = require('request');

const config = require('../lib/config');
const utils = require('../lib/utils');
const fhir = require('../lib/fhir');

/**
 * @api {post} /create/hr Populate a FHIR heart rate template with the supplied values
 * @apiName CreateHR
 * @apiGroup Create
 *
 * @apiParam {String} id Unique ID of this reading.
 * @apiParam {String} averageHeartRateInBeatsPerMinute  Heart rate value.
 * @apiParam {String} subjectReference ID of the patient to which this reading pertains.
 *
 */
router.post('/hr', function(req, res, next) {

  fhir.createObservationResource("HR", req.body, function(status) { res.sendStatus(status); });

});

/**
 * @api {post} /create/bp Populate a FHIR blood pressure template with the supplied values
 * @apiName CreateBP
 * @apiGroup Create
 *
 * @apiParam {String} id Unique ID of this reading.
 * @apiParam {String} 271649006  Systolic blood pressure value.
 * @apiParam {String} 271650006  Diastolic blood pressure value.
 * @apiParam {String} 8867-4  Heart rate value.
 * @apiParam {String} subjectReference ID of the patient to which this reading pertains.
 *
 */
router.post('/bp', function(req, res, next) {

  fhir.createObservationResource("BP", req.body, function(status) { res.sendStatus(status); });

});

module.exports = router;
