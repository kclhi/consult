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

		const parser = parse({delimiter: ' '}, function (err, data) {

			if ( data ) {

				dataArray = [];

		    data.forEach(function(row) {

					dataArray.push(row);

				});

				headers = dataArray.shift();

				async.eachSeries(dataArray, function (row, next){

					var jsonRow = {};

					jsonRow.reading = "HR";
					jsonRow.id = uuidv1();
					jsonRow.subjectReference = req.params.patientID;
					jsonRow.practitionerReference = req.params.practitionerID;

					row.forEach(function(entry) {

						jsonRow[headers[row.indexOf(entry)]] = entry;

					});

					messageObject.send(config.get('sensor_to_fhir.URL') + "/create/hr", jsonRow).then(() => next());

				}, function(error) {

					if (error) logger.error(error);
					res.sendStatus(200);

				});

			} else {

				logger.error("Data not supplied in suitable format");
				res.sendStatus(304);

			}

		});

		fs.createReadStream("routes/sample-data/hr.csv").pipe(parser);

	});

	return router;

}
