const express = require('express');
const router = express.Router();
const config = require('config');
const models = require('../models');

const logger = require('../config/winston');

module.exports = function(messageObject) {

  /**
   * @api {get} /register/:patientId/:patchId Register a patient ID against a device.
   * @apiName registerPatient
   * @apiGroup Register
   *
   * @apiParam {Number} patientId The ID associated with a patient, and their data, within the system.
   * @apiParam {Number} patchId The ID listed on a vitalpatch
   *
   */
  router.get('/:patientId/:patchId', function (req, res) {

    if ( req.params.patientId && req.params.patchId ) {

      models.users.findOrCreate({

        where: {

          patientId: req.params.patientId

        },
        defaults: {

          patientId: req.params.patientId,
          patchId: req.params.patchId

        }

      }).error(function(err) {

        logger.error(err);

      }).then(function() {

        res.sendStatus(200);

      });

    } else {

      logger.error("Did not get patientId and patchId in URL");

    }

  });

  return router;

}
