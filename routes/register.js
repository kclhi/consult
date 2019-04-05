const express = require('express');
const router = express.Router();
const auth = require('basic-auth');
const logger = require('../config/winston');

/**
 * @api {get} /register/:patientId Register a patient ID against a device.
 * @apiName registerPatient
 * @apiGroup Register
 *
 * @apiParam {Number} patientId The ID associated with a patient, and their data, within the system.
 *
 */
router.get('/:patientId', (req, res) => {

  // TODO: Verify patient exists in system?
  req.session.patientId = req.params.patientId
  res.redirect('/garmin/connect/garmin');

});

module.exports = router;
