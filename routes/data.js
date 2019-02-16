var express = require('express');
var router = express.Router();
var request = require('request');
var models = require('../models');
const config = require('../lib/config');
var oauthSignature = require('oauth-signature');

router.get('/daily/:id/:start/:end', (req, res) => {

    

});

module.exports = router;
