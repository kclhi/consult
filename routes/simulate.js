const express = require('express');
const request = require('request');
const router = express.Router();
const async = require('async');
const uuidv1 = require('uuid/v1');
const logger = require('../config/winston');

const models = require('../models');
const utils = require('../lib/utils');
const config = require('config');

module.exports = function(messageObject) {

	/**
	 * @api {get} /simulate/incomingECG/:patientID/:practitionerID Grab simulated ECG data from vital patch API and push through system.
	 * @apiName simulateECG
	 * @apiGroup Simulate
	 *
	 * @apiParam {String} patientID Patient unique ID.
	 * @apiParam {String} practitionerID Practitioner unique ID.
	 */
	router.get('/incomingECG/:patientID/:practitionerID', function(req, res, next) {

		request.post("https://us-central1-mbshealthstream.cloudfunctions.net/getEcgFilesByPatchId", {
			json: {
				"patchId":"VC2B008BF_FFD00E",
				"licenseKey": config.get("vitalpatch.LICENSE_KEY"),
				"apiKey": config.get("vitalpatch.API_KEY")
			},
	  }, function(error, response, body) {

			if ( !error && ( response && response.statusCode == 200 ) && body && body.files ) {

				var arr = body.files.map(a => a.ecgFile).sort();
				var arr_offline = arr.filter(w => w.includes("_OFFLINE_"));
				var arr_other   = arr.filter(w => ! w.includes("_OFFLINE_"));
				var arr_out = arr_other;
				var outputMsgs = [];

				for (var w in arr_out) outputMsgs.push({url:arr_out[w],payload:arr_out[w]});

				request.get(outputMsgs[0].payload, function(error, response, body) {

					var currentTimestamp = -1;
					var timestampsAndValues = body.split(/[\n,]+/)
					var currentECGSegement = [];
					var allECGSegements = {};

					for ( var i = 0; i < timestampsAndValues.length - 1; i = i + 2 ) {

						var unixTimestamp = Math.trunc(timestampsAndValues[i] / 1000);

						if ( unixTimestamp != currentTimestamp && currentECGSegement.length > 0 ) {

							allECGSegements[currentTimestamp] = currentECGSegement;
							currentTimestamp = unixTimestamp;
							currentECGSegement = [];

						} else {

							currentECGSegement.push(timestampsAndValues[i+1])

						}

					}

					async.eachSeries(Object.keys(allECGSegements), function(timestamp, done) {

						rawData = utils.replaceAll(allECGSegements[timestamp].toString(), ",", " ")

						var json = {
							"reading": "ECG",
							"id": uuidv1(),
							"subjectReference": req.params.patientID,
							"practitionerReference": req.params.practitionerID,
							"data": rawData,
							"effectiveDateTime": new Date(timestamp * 1000)
						};

						messageObject.send(config.get('sensor_to_fhir.URL') + "/create/ecg", json).then(() => done());

					}, function(ecgError) {

						if (ecgError) logger.error(ecgError);
						res.sendStatus(200);

					});

				});

			} else {

				logger.error("Could not acquire ECG data. " + error + " " + ( response && response.body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ) + " " + ( response && response.statusCode ? response.statusCode : "" ));
				res.sendStatus(301);

			}

	 	});

	});

	return router;

}
