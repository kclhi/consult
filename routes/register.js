var express = require('express');
var router = express.Router();
var auth = require('basic-auth');

router.get('/:id', (req, res) => {

    req.session.userid = req.params.id
    res.redirect('/garmin/connect/garmin');

});

module.exports = router;
