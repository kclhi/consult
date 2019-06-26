const express = require('express');
const router = express.Router();
const request = require('request');
const async = require('async');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const config = require('config');
const logger = require('../config/winston');
const crypto = require('crypto');
const generatePassword = require('password-generator');

const provenance = require('../lib/provenance');
const patient = require('../lib/patient');
const utils = require('../lib/utils');

let ldapClient;

function updateLDAPClient(client) {

  ldapClient = client;

}

function addUser(username, password, callback) {

  logger.info("Adding LDAP entry...");

  var entry = {
    cn: username,
    sn : "anon",
    uid: username,
    objectClass: 'inetOrgPerson',
    // TODO: Password should not be in plaintext on LDAP server. Password should be generated.
    userPassword: password
  }

  ldapClient.bind('cn=admin,dc=consult,dc=kcl,dc=ac,dc=uk', config.get("ldap_server.MANAGER_PASSWORD"), function(error) {

    if (error) {

      logger.error("Error binding to LDAP server: " + error);
      res.sendStatus(400);

    } else {

      logger.info("Bound to LDAP server.");

      // NB: No spaces between LDAP domain string entries.
      ldapClient.add("cn=" + username + ",dc=consult,dc=kcl,dc=ac,dc=uk", entry, function(error) {

        if ( error ) {

          logger.error("Error adding user to LDAP service: " + error);
          res.sendStatus(400);

        } else {

          logger.info("Added user to LDAP server.");

          // ~MDC Should happen, but broken in the ldapjs API at present.
          // ldapClient.unbind(function(error) {

            // Under Mattermost enterprise, the below is unnecessary, as it can also be configured to query an LDAP server.
            request({

              method: "POST",
              url: config.get('dialogue_manager.URL') + "/user/create",
              headers: {

               "Authorization": "Basic " + new Buffer(config.get('credentials.USERNAME') + ":" + config.get('credentials.PASSWORD')).toString("base64")

              },
              json: {

                "username": username,
                "password": password,
                "email": username + "@consult.kcl.ac.uk"

              },
              requestCert: true

            },
            function (error, response, body) {

              if (!error && ( response && response.statusCode == 200 ) ) {

                logger.info("Instructed the dialogue manager to create new user.");
                callback(200);

              } else {

                logger.error("Could not contact the dialogue manager. " + error + " " + ( response && response.body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ) + " " + ( response && response.statusCode ? response.statusCode : "" ));
                callback(400);

              }

            });

          // });

        }

      });

    }

  });

}

/**
 * @api {get} /register/:id/:token Exchange a (second) temporary token acquired along with a system ID (post record collection based upon NHS number) for a full password and thus access to the UI and chat. Patient signup protocol step 3.
 * @apiName GetPassword
 * @apiGroup Register
 *
 * @apiParam {String} id System ID supplied in exachange for first token supplied upon provision of NHS number.
 * @apiParam {String} token Token supplied upon issue of system ID.
 *
 * @apiSuccess {String} Confirmation of ID and newly generated password.
 */
router.get('/register/:id/:token', function(req, res, next) {

  if ( config.get('user_registration.ENABLED') ) {

    const hash = crypto.createHmac('sha256', config.get('credentials.SECRET')).update(req.params.id).digest('hex');

    if ( req.params.token == hash ) {

      logger.info("Valid details supplied. Creating user.");
      const password = generatePassword();
      addUser(req.params.id, password, function(status) {

        if ( status == 200 ) {

          res.send(req.params.id + " " + password);

        } else {

          res.sendStatus(status);

        }

      });

    } else {

      logger.info("Invalid details supplied.");
      res.sendStatus(400);

    }

  } else {

    res.send("User registration is not enabled.");

  }

});

router.put('/:id', function(req, res, next) {

  // Only create user accounts automatically if we don't require users to sign up themselves with a token.
  if (!config.get('user_registration.ENABLED')) {

    logger.info("Recieved new patient entry. Creating user.");
    addUser(req.params.id, "12345", function(status) {

      res.sendStatus(status);

    });

  } else {

    logger.info("Automatic patient registration is disabled. Patient must be registered manually.");
    res.sendStatus(200);

  }

});

/**
 * @api {get} /:patientID Request patient information
 * @apiName GetPatient
 * @apiGroup Patient
 *
 * @apiParam {Number} patientID Users unique ID.
 *
 * @apiSuccess {List} Patient data: ID, DOB, age, ethnicity, subscribed medication and conditions.
 */
router.get('/:patientID', function(req, res, next) {

  if ( req.params && req.params.patientID ) {

    patient.getPatientStats(req.params.patientID, function(patientHeaders, patientRow) {

      if ( patientHeaders && patientRow ) {

        patientHeadersRow = {};
        patientHeadersRow["pid"] = req.params.patientID;

        patientHeaders.forEach(function(patientHeader) {

          patientHeadersRow[patientHeader] = patientRow[patientHeaders.indexOf(patientHeader)];

        })

        res.send(patientHeadersRow);

      } else {

        logger.error("Could not find patient.");
        res.send(404);

      }

    });

  } else {

    res.sendStatus(400);

  }

});

module.exports = {
  patient: router,
  updateLDAPClient,
};
