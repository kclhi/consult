var express = require('express');
var router = express.Router();
var auth = require('basic-auth');

/**
 * @api {get} /garmin/register/:patientId Register a patient ID against a device.
 * @apiName registerPatient
 * @apiGroup Register
 *
 * @apiParam {Number} patientId The ID associated with a patient, and their data, within the system.
 *
 */
router.get('/:patientId', (req, res) => {

    req.session.patientId = req.params.patientId
    res.redirect('/garmin/connect/garmin');

});

module.exports = router;
