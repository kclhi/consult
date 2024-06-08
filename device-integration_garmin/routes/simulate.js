const express = require('express');
const request = require('request');
const router = express.Router();
const async = require('async');
const { v1: uuidv1 } = require('uuid');
const logger = require('../config/winston');
const parse = require('csv-parse');
const fs = require('fs');

const config = require('config');
const utils = require('../lib/utils');

const PRACTITIONER_ID = "da6da8b0-56e5-11e9-8d7b-95e10210fac3";

module.exports = function(messageObject) {

	function sendHRData(patientID, practitionerID, callback) {

		const parser = parse({delimiter: ' '}, function (err, data) {

			if ( data ) {

				dataArray = [];

		    data.forEach(function(row) {

					dataArray.push(row);

				});

				headers = dataArray.shift();

				if ( config.get('simulate.TIME_SHIFT') ) {

					dataArray = dataArray.slice(0, 365);
					var simulatedReadingDate = new Date();
					simulatedReadingDate.setDate(simulatedReadingDate.getDate() - dataArray.length);

				}

				async.eachSeries(dataArray, function (row, next){

					var jsonRow = {};

					jsonRow.reading = "HR";
					jsonRow.id = uuidv1();
					jsonRow.subjectReference = patientID;
					jsonRow.practitionerReference = practitionerID;

					row.forEach(function(entry) {

						if ( config.get('simulate.TIME_SHIFT') && headers[row.indexOf(entry)] == "effectiveDateTime" ) {

							jsonRow["effectiveDateTime"] = simulatedReadingDate;

						} else {

							jsonRow[headers[row.indexOf(entry)]] = entry;

						}

					});

					if ( config.get('simulate.TIME_SHIFT') ) simulatedReadingDate.setDate(simulatedReadingDate.getDate() + 1);
					messageObject.send(config.get('sensor_to_fhir.URL') + "/create/hr", jsonRow).then(() => next());

				}, function(error) {

					if (error) logger.error(error);
					callback(200);

				});

			} else {

				logger.error("Data not supplied in suitable format");
				callback(304);

			}

		});

		fs.createReadStream("routes/sample-data/hr.csv").pipe(parser);

	}
	/**
	 * @api {get} /simulate/incomingHR Simulate a set of incoming (separate from BP) heart rate values.
	 * @apiName simulateHR
	 * @apiGroup Simulate
	 *
	 * @apiParam {String} patientID Patient unique ID.
	 * @apiParam {String} practitionerID Practitioner unique ID.
	 */
	router.get('/incomingHR/:patientID/:practitionerID', function(req, res, next) {

		sendHRData(req.params.patientID, req.params.practitionerID, function(status) {
			res.sendStatus(status);
		});

	});

	router.get('/incomingHR/:patientID', function(req, res, next) {

		sendHRData(req.params.patientID, PRACTITIONER_ID, function(status) {
			res.sendStatus(status);
		});

	});

	router.post('/incomingHR/:patientID', function(req, res, next) {

		sendHRData(req.params.patientID, PRACTITIONER_ID, function(status) {
			res.sendStatus(status);
		});

	});

	return router;

}
