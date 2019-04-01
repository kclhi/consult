const express = require('express');
const router = express.Router();
const request = require('request');
const async = require('async');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const config = require('config');
const logger = require('../config/winston');
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

const provenance = require('../lib/provenance');
const utils = require('../lib/utils');

module.exports = function(ldapClient) {

  router.put('/:id', function(req, res, next) {

    var entry = {
      cn: req.params.id,
      sn : "anon",
      uid: req.params.id,
      objectClass: 'inetOrgPerson',
      // TODO: Password should not be in plaintext. Password should be generated.
      userPassword: "12345"
    }

    logger.info("Recieved new patient entry. Adding LDAP entry...");

    ldapClient.add("cn=" + req.params.id + ", dc=consult, dc=kcl, dc=ac, dc=uk", entry, function(error) {

      if ( error ) {

        logger.error("Error adding user to LDAP service: " + error);
        res.sendStatus(400);

      } else {

        logger.info("Added user to LDAP server.");

        // Under Mattermost enterprise, the below is unnecessary, as it can also be configured to read from an LDAP server.
        request({

          method: "POST",
          url: config.get('dialogue_manager.URL') + "/user/create",
          headers: {

           "Authorization": "Basic " + new Buffer(config.get('credentials.USERNAME') + ":" + config.get('credentials.PASSWORD')).toString("base64")

          },
          json: {

            "username": req.params.id,
            "password": "12345",
            "email": req.params.id + "@consult.kcl.ac.uk"

          },
          requestCert: true

        },
        function (error, response, body) {

          if (!error && ( response && response.statusCode == 200 ) ) {

            logger.info("Instructed the dialogue manager to create new user.");
            res.sendStatus(200);

          } else {

            logger.error("Could not contact the dialogue manager. " + error + " " + ( response && response.body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ) + " " + ( response && response.statusCode ? response.statusCode : "" ));
            res.sendStatus(400);

          }

        });

      }

    });

  });

  return router;

}
