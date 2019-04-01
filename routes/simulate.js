const express = require('express');
const request = require('request');
const router = express.Router();
const async = require('async');
const uuidv1 = require('uuid/v1');

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
				"patchId":"VC2B008BF_FFD00F",
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

				for (var w in arr_out) {
					outputMsgs.push({url:arr_out[w],payload:arr_out[w]});
				}

				request.get(outputMsgs[0].payload, function(error, response, body) {

					var json = {
						"reading": "ECG",
						"id": uuidv1(),
						"subjectReference": req.params.patientID,
						"practitionerReference": req.params.practitionerID,
						"data": utils.replaceAll(utils.replaceAll(utils.replaceAll(body, "[0-9]{13}\,", ""), "\n", " "), ",", " ")
					};

					messageObject.send(config.get('sensor_to_fhir.URL') + "/create/ecg", json).then(() => res.sendStatus(200));

				});

			} else {

				console.log(error);

			}

	 	});

	});

	return router;

}
