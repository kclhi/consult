const express = require('express');
const request = require('request');
const router = express.Router();
const async = require('async');
const uuidv1 = require('uuid/v1');
const logger = require('../config/winston');

const config = require('config');

module.exports = function(messageObject) {

	/**
	 * @api {get} /simulate/incomingHR Simulate a set of incoming (separate from BP) heart rate values.
	 * @apiName simulateHR
	 * @apiGroup Simulate
	 *
	 * @apiParam {String} patientID Patient unique ID.
	 * @apiParam {String} practitionerID Practitioner unique ID.
	 */
	router.get('/incomingHR/:patientID/:practitionerID', function(req, res, next) {

		simulatedHRValues = [[82,	92],
												 [77,	87],
												 [79,	89],
												 [79,	89],
												 [86,	96],
												 [87,	97],
												 [79,	89],
												 [98,	108],
												 [107,	117],
												 [98,	108],
												 [104,	114],
												 [97,	107],
												 [94,	104],
												 [82,	92],
												 [105,	115],
												 [88,	98],
												 [84,	94],
												 [97,	107],
												 [94,	104],
												 [96,	106],
												 [97,	107],
												 [86,	96],
												 [97,	107],
												 [93, 103],
												 [81,	91],
												 [87,	97]];

		async.eachSeries(simulatedHRValues, function (value, next){

			var json = {
				"reading": "HR",
				"id": uuidv1(),
				"subjectReference": req.params.patientID,
				"practitionerReference": req.params.practitionerID,
				"restingHeartRateInBeatsPerMinute": value[0],
				"maxHeartRateInBeatsPerMinute": value[1],
				"intensityDurationPercentage": 0
			};

			messageObject.send(config.get('sensor_to_fhir.URL') + "/create/hr", json).then(() => next());

		}, function(err) {

			res.sendStatus(200);

		});

	});

	return router;

}
