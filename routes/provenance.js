var express = require('express');
var router = express.Router();
const config = require('../lib/config');
const provenance = require('../lib/provenance')

router.get('/test', function(req, res, next) {

    provenance.test();
    res.sendStatus(200);

});

module.exports = router;
