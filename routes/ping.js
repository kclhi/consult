var express = require('express');
var router = express.Router();
var models = require('../models');

router.post('/ping', (req, res) => {

    console.log(req.body);

    res.sendStatus(200);

});

module.exports = router;
