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

          mattermost.createHook(token, teamId, "connie", "", "", function(success) {

            if ( success ) {

              mattermost.createCommand(token, teamId, "P", "start", config.get('dialogue_manager.URL') + "/response", function(success) {

                if ( success ) {

                  request.post(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/users", {

                    headers: {
                     "Authorization": "Bearer " + token
                    },
                    json: {
                      "username": req.body.username,
                      "password": req.body.password,
                      "email": req.body.email
                    }

                  },
                  function (error, response, body) {

                    if ( !error && ( response && response.statusCode < 400 ) ) {

                      request.post(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/teams/" + teamId + "/members", {

                        headers: {
                         "Authorization": "Bearer " + token
                        },
                        json: {
                          "team_id": teamId,
                          "user_id": body.id
                        }

                      },
                      function (error, response, body) {

                        if ( !error && ( response && response.statusCode < 400 ) ) {

                          logger.info("Created user.");
                          res.sendStatus(200);

                        } else {

                          logger.error("Error adding user to team: " + error + " " + ( response.statusCode ? response.statusCode : "" ) + " " + ( typeof response.body === 'object' ? JSON.stringify(body) : "" ) );
                          res.sendStatus(400);

                        }

                      });

                    } else {

                      logger.error("Error adding user: " + error + " " + ( response.statusCode ? response.statusCode : "" ) + " " + ( typeof response.body === 'object' ? JSON.stringify(body) : "" ) );
                      res.sendStatus(400);

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
