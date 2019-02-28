var express = require('express');
var request = require('request');
var router = express.Router();
const config = require('../lib/config');
var models = require('../models');
var async = require('async');

/**
 * @api {get} /simulate/incomingHR Simulate a set of incoming (separate from BP) heart rate values.
 * @apiName simulateHR
 * @apiGroup Simulate
 *
 */
router.get('/incomingHR', function(req, res, next) {

		simulatedHRValues = [["3", 82,	92],
												 ["3", 77,	87],
												 ["3", 79,	89],
												 ["3", 79,	89],
												 ["3", 86,	96],
												 ["3", 87,	97],
												 ["3", 79,	89],
												 ["3", 98,	108],
												 ["3", 107,	117],
												 ["3", 98,	108],
												 ["3", 104,	114],
												 ["3", 97,	107],
												 ["3", 94,	104],
												 ["3", 82,	92],
												 ["3", 105,	115],
												 ["3", 88,	98],
												 ["3", 84,	94],
												 ["3", 97,	107],
												 ["3", 94,	104],
												 ["3", 96,	106],
												 ["3", 97,	107],
												 ["3", 86,	96],
												 ["3", 97,	107],
												 ["3", 93, 103],
												 ["3", 81,	91],
												 ["3", 87,	97]];

		async.eachSeries(simulatedHRValues, function (value, next){

				request.post(config.SENSOR_TO_FHIR_URL + "convert/hr", {

						json: {

								id: "t" + Date.now(),
								subjectReference: value[0],
								restingHeartRateInBeatsPerMinute: value[1],
								maxHeartRateInBeatsPerMinute: value[2],
								intensityDurationPercentage: 0

						},

				},
				function (error, response, body) {

						if (!error && response.statusCode == 200) {

								 console.log(response.body)

						} else {

								 console.log(error)

						}

						next();

				});

		}, function(err) {

					res.sendStatus(200);

		});

});

module.exports = router;
