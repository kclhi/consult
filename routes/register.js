var express = require('express');
var router = express.Router();
var auth = require('basic-auth');

router.get('/:patientId', (req, res) => {

    req.session.patientId = req.params.patientId
    res.redirect('/garmin/connect/garmin');

});

module.exports = router;
