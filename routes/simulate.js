const express = require('express');
const request = require('request');
const router = express.Router();
const async = require('async');
const uuidv1 = require('uuid/v1');
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

				}, function(err) {

					res.sendStatus(200);

				});

			} else {

				console.error("Data not supplied in suitable format");

			}

		});

		fs.createReadStream("routes/sample-data/hr.csv").pipe(parser);

	});

	return router;

}
