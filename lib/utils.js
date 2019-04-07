const request = require('request');
const fs = require('fs');
const config = require('config');
const logger = require('../config/winston');

class Utils {

  static callFHIRServer(query, params, callback, username="", password="") {

    var url = config.get('fhir_server.URL') + config.get('fhir_server.REST_ENDPOINT') + query + "?_format=json&" + params;

    request.get(url, {

      headers: {

       "Authorization": "Basic " + new Buffer(username + ":" + password).toString("base64"),

      },
      requestCert: true

    }, function(error, response, body) {

      if ( error || (response && response.statusCode >= 400) ) {

        logger.debug("Cannot contact FHIR server. " + error + " " + ( ( body && typeof body === "object" ) ? JSON.stringify(body) : body ) + " " + ( response && response.statusCode ? response.statusCode : "Status unknown." ));
        callback(null);

      } else {

        callback(body);

      }

    });

  }

  static dayOfWeekAsString(dayIndex) {

    return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex];

  }

  static replaceAll(str, find, replace) {

    return str.replace(new RegExp(find, 'g'), replace);

  }

  // Does the item at the end of the path specified exist? If so, return it.
  static validPath(object, path) {

    if (!object) return false;

    for (var child in path) {

      // Because existence check fails if value is 0.
      if ( object[path[child]] || object[path[child]] == 0  ) {

        object = object[path[child]];

      } else {

        logger.debug("Valid path check error. " + path[child] + " not in " + JSON.stringify(object).substring(0, 300));
        return false

      }

    }

    return object;

  }

  static noParse(target, path, object) {

    var pathInfo = "";
    if ( path.length > 0 ) pathInfo =  path.toString() + " not a valid path in ";
    logger.debug("Could not parse " + target + ". " + pathInfo + ( typeof object === "object" ? JSON.stringify(object).substring(0, 300) : object))

  }

  static JSONParseWrapper(string) {

    var parsed;

    try {

      parsed = JSON.parse(string);

    } catch(e) {

      logger.error("Could not parse: " + string);
      return false;

    }

    return parsed;

  }

}

module.exports = Utils;
