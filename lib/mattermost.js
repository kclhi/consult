const request = require('request');
const fs = require('fs');
const config = require('config');
const logger = require('../config/winston');
const uuidv1 = require('uuid/v1');

const utils = require('../lib/utils');

class Mattermost {

  static login(callback) {

    request.post(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/users/login", {

      json: {
        "login_id": config.get('mattermost.ADMIN_USERNAME'),
        "password": config.get('mattermost.ADMIN_PASSWORD')
      }

    },
    function (error, response, body) {

      // Needs extra definition because of class scope?
      var token;
      if ( !error && ( response && response.statusCode < 400 ) && ( token = response.headers.token ? response.headers.token : false ) ) {

        callback(token);

      } else {

        logger.error("Error logging in to API: " + error + ", status code: " + ( response && response.statusCode ? response.statusCode : "" ) + ", body: " + ( body && typeof response.body === 'object' ? JSON.stringify(body) : body ) + ", token: " + token);
        callback(null);

      }

    });

  }

  static createTeam(token, callback) {

    const teamId = uuidv1();

    request.post(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/teams", {

      headers: {
       "Authorization": "Bearer " + token
      },
      requestCert: true,
      json: {
        "name": teamId,
        "display_name": teamId,
        "type": "I"
      }

    },
    function (error, response, body) {

      if ( !error && ( response && response.statusCode < 400 ) ) {

        callback(body.id);

      } else {

        logger.error("Error creating team: " + error + " " + ( response && response.statusCode ? response.statusCode : "" ) + " " + ( body && typeof response.body === 'object' ? JSON.stringify(body) : "" ) );
        callback(null);

      }

    });

  }

  static createHook(token, teamId, user, description, icon, callback) {

    request.get(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/teams/" + teamId + "/channels/name/off-topic", {

      headers: {
       "Authorization": "Bearer " + token
      },
      requestCert: true,

    },
    function (error, response, body) {

      var parsedChannel, channelId;
      if ( !error && ( response && response.statusCode < 400 ) && ( parsedChannel = utils.JSONParseWrapper(body) ) && ( channelId = utils.validPath(parsedChannel, ["id"]) ) ) {

        request.post(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/hooks/incoming", {

          headers: {
           "Authorization": "Bearer " + token
          },
          requestCert: true,
          json: {
            "channel_id": channelId,
            "display_name": user,
            "description" : description,
            "username": user,
            "icon_url": icon
          }

        },
        function (error, response, body) {

          if ( !error && ( response && response.statusCode < 400 ) ) {

            callback(true);

          } else {

            logger.error("Error creating hook: " + error + " " + ( response && response.statusCode ? response.statusCode : "" ) + " " + ( body && typeof response.body === 'object' ? JSON.stringify(body) : "" ) );
            callback(false);

          }

        });

      } else {

        logger.error("Error getting channel ID for hook: " + error + " " + ( response && response.statusCode ? response.statusCode : "" ) + " " + ( body && typeof response.body === 'object' ? JSON.stringify(body) : "" ) );
        callback(false);

      }

    });

  }

  static createCommand(token, teamId, method, trigger, url, callback) {

    const teamID = uuidv1();

    request.post(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/commands", {

      headers: {
       "Authorization": "Bearer " + token
      },
      requestCert: true,
      json: {
        "team_id": teamId,
        "method": method,
        "trigger": trigger,
        "url": url
      }

    },
    function (error, response, body) {

      if ( !error && ( response && response.statusCode < 400 ) ) {

        callback(true);

      } else {

        logger.error("Error creating command: " + error + " " + ( response && response.statusCode ? response.statusCode : "" ) + " " + ( body && typeof response.body === 'object' ? JSON.stringify(body) : "" ) );
        callback(false);

      }

    });

  }

  static getTeamID(token, callback) {

    request.get(config.get('mattermost.CHAT_INTERNAL_URL') + config.get('mattermost.API_PATH') + "/teams", {

      headers: {
       "Authorization": "Bearer " + token
      },
      requestCert: true

    },
    function (error, response, body) {

      var parsedTeam, teamID;
      if ( !error && ( response && response.statusCode < 400 ) && ( parsedTeam = utils.JSONParseWrapper(body) ) && ( teamID = utils.validPath(parsedTeam, ["0", "id"]) ) ) {

        callback(teamID);

      } else {

        logger.error("Error getting teams for ID: " + error + " " + ( response && response.statusCode ? response.statusCode : "" ) + " " + ( body && typeof response.body === 'object' ? JSON.stringify(body) : "" ) );
        callback(null);

      }

    });

  }


}

module.exports = Mattermost;
