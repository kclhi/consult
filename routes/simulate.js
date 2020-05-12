const express = require('express');
const router = express.Router();
const config = require('config');

const medi = require('../lib/medi');

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

		res.sendStatus(medi.getAndForward(req.params.patientId, req.params.practitionerId, config.get("vitalpatch.DEFAULT_PATCH_ID"), messageObject));

	});

	return router;

}
