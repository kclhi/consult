const express = require('express');
const request = require('request');
const router = express.Router();
const fs = require('fs');

const config = require('config');

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

  request.post(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/users/login", {
    json: {
      "login_id": config.get('mattermost.ADMIN_USERNAME'),
      "password": config.get('mattermost.ADMIN_PASSWORD')
    },
    rejectUnauthorized: false,
    requestCert: true
  },
  function (error, response, body) {

    if ( !error && ( response && response.statusCode < 400 ) && ( token = ( response && response.headers.token ? response.headers.token : false ) ) ) {

      request.get(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/users/", {
        headers: {
         "Authorization": "Bearer " + token
        },
        json: {
          "username": req.body.id,
          "password": req.body.password,
          "email": req.body.email
        },
        rejectUnauthorized: false,
        requestCert: true
      },
      function (error, response, body) {

        if ( !error && ( response && response.statusCode < 400 ) && ( team = ( body && JSON.parse(body)[0].id ? JSON.parse(body)[0].id : false ) ) ) {

          res.sendStatus(200);

        } else {

          console.log(error + " " + ( response.statusCode ? response.statusCode : "" ) + " " + ( typeof response.body === 'object' ? JSON.stringify(body) : "" ) );
          res.sendStatus(400);

        }

      });

    } else {

      console.log(error + " " + ( response.statusCode ? response.statusCode : "" ) + " " + ( typeof response.body === 'object' ? JSON.stringify(body) : "" ) );
      res.sendStatus(400);

    }

  });

});

module.exports = router;
