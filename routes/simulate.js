const express = require('express');
const router = express.Router();
const config = require('config');
const fs = require('fs');
const medi = require('../lib/medi');

const PRACTITIONER_ID = "da6da8b0-56e5-11e9-8d7b-95e10210fac3";

module.exports = function(messageObject) {

	/**
	 * @api {get} /simulate/incomingECG/:patientID/:practitionerID Grab simulated ECG data from vitalpatch API and push through system.
	 * @apiName simulateECG
	 * @apiGroup Simulate
	 *
	 * @apiParam {String} patientID Patient unique ID.
	 * @apiParam {String} practitionerID Practitioner unique ID.
	 */
	router.get('/incomingECG/:patientId/:practitionerId', function(req, res, next) {

		fs.readFile("routes/sample-data/ecg.csv", "utf8", function(err, data) {

			res.sendStatus(medi.processSingleECGFile(req.params.patientId, req.params.practitionerId, data, messageObject));

		});

	});

	router.get('/incomingECG/:patientId', function(req, res, next) {

		fs.readFile("routes/sample-data/ecg.csv", "utf8", function(err, data) {

			res.sendStatus(medi.processSingleECGFile(req.params.patientId, PRACTITIONER_ID, data, messageObject));

		});

	});

	router.post('/incomingECG/:patientId', function(req, res, next) {

		fs.readFile("routes/sample-data/ecg.csv", "utf8", function(err, data) {

			res.sendStatus(medi.processSingleECGFile(req.params.patientId, PRACTITIONER_ID, data, messageObject));

		});

	});

	return router;

}
