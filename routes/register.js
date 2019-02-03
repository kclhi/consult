var express = require('express');
var router = express.Router();

router.get('/:id', (req, res) => {

    req.session.userid = req.params.id
    res.redirect('/garmin/connect/garmin');

});

module.exports = router;
