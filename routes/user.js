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
 * @apiParam {Number} dialogueID Create a user with this password.
 * @apiParam {Number} email Create a user with this email address.
 *
 */
router.post('/create', function(req, res, next) {

  mattermost.login(function(token) {

    if ( token ) {

      mattermost.getTeamID(token, function(team) {

        if ( team ) {

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

              request.post(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/teams/" + team + "/members", {

                headers: {
                 "Authorization": "Bearer " + token
                },
                json: {
                  "team_id": team,
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
