const express = require('express');
const request = require('request');
const router = express.Router();
const fs = require('fs');
const logger = require('../config/winston');
const config = require('config');

const mattermost = require('../lib/mattermost');

/**
 * @api {post} /create Create a Mattermost user.
 * @apiName CreateUser
 * @apiGroup Users
 *
 * @apiParam {String} username Create a user with this name.
 * @apiParam {Number} password Create a user with this password.
 * @apiParam {Number} email Create a user with this email address.
 *
 */
router.post('/create', function(req, res, next) {

  mattermost.login(function(token) {

    if ( token ) {

      mattermost.createTeam(token, function(teamId) {

        if ( teamId ) {

          mattermost.createHook(token, teamId, config.get('chatbot.USERNAME'), "", "", function(success) {

            if ( success ) {

              mattermost.createCommand(token, teamId, "P", config.get('chatbot.COMMAND'), config.get('dialogue_manager.URL') + "/response", function(success) {

                if ( success ) {

                  mattermost.createUser(token, req.body.username, req.body.password, req.body.email, teamId, function(success) {

                    if ( success ) {

                      res.sendStatus(200);

                    } else {

                      res.sendStatus(400);
                      logger.error("Got false for create user success.")

                    }

                  });

                } else {

                  logger.error("Got false for create command success.")

                }

              });

            } else {

              logger.error("Got false for create hook success.")

            }

          });

        } else {

          logger.error("Got null value for team.");
          res.sendStatus(400);

        }

      });

    } else {

      logger.error("Got null value for token.");
      res.sendStatus(400);

    }

  });

});

module.exports = router;
