var express = require('express');
var router = express.Router();
var models = require('../models');

router.get('/callback', (req, res) => {

    if (!req.session.patientId) {
      res.end();
      return;
    }

    models.users.findOrCreate({

        where: {

            id: req.session.patientId

        },
        defaults: {

            id: req.session.patientId,
            token: req.query.access_token,
            secret: req.query.access_secret

        }

    }).error(function(err) {

        console.log(err);

    }).then(function() {});

    res.end();

});

module.exports = router;
