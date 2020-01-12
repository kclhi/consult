const express = require('express');
const router = express.Router();

const utils = require('../lib/utils');
const medi = require('../lib/medi');

module.exports = function(messageObject) {

	/**
	 * @api {get} /simulate/incomingECG/:patientID/:practitionerID Grab simulated ECG data from vital patch API and push through system.
	 * @apiName simulateECG
	 * @apiGroup Simulate
	 *
	 * @apiParam {String} patientID Patient unique ID.
	 * @apiParam {String} practitionerID Practitioner unique ID.
	 */
	router.get('/incomingECG/:patientId/:practitionerId', function(req, res, next) {

		res.sendStatus(medi.getAndForward(req.params.patientId, req.params.practitionerId, "VC2B008BF_FFD00E", messageObject));

	});

	return router;

}
