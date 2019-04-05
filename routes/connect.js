const express = require('express');
const router = express.Router();
const models = require('../models');
const logger = require('../config/winston');

router.get('/callback', (req, res) => {

  if (!req.session.patientId) {
    res.end();
    return;
  }

  if ( req.query.access_token && req.query.access_secret ) {

    // TODO: Update details if user happens to register again OR disable re-registration.
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

      logger.error(err);

    }).then(function() {});

  } else {

    logger.error("Did not get access token and secret in header, instead got: " + ( req.query ? req.query : "none."));

  }

  res.sendStatus(200);

});

module.exports = router;
