var express = require('express');
var router = express.Router();
var models = require('../models');

router.get('/callback', (req, res) => {

    if (!req.session.userId) {
      res.end();
      return;
    }

    models.users.findOrCreate({

        where: {

            id: req.session.userId

        },
        defaults: {

            id: req.query.userId,
            token: req.query.access_token,
            secret: req.query.access_secret

        }

    }).error(function(err) {

        console.log(err);

    }).then(function() {});

    res.end();

});

module.exports = router;
