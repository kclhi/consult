const request = require('request');
const fs = require('fs');
const config = require('../lib/config');

class Utils {

  static callFHIRServer(query, params, callback) {

    var url = config.FHIR_SERVER_URL + config.FHIR_REST_ENDPOINT + query + "?_format=json&" + params;

    request.get(url, {

      headers: {
       "Authorization": "Basic " + new Buffer(config.USERNAME + ":" + config.PASSWORD).toString("base64"),
      },
      rejectUnauthorized: false,
      requestCert: true

    }, function(error, response, body) {

      if ( error || (response && response.statusCode >= 400) ) {

        console.log("Cannot contact FHIR server. " + error + " " + ( ( body && typeof body === "object" ) ? JSON.stringify(body) : body ) + " " + ( response.statusCode ? response.statusCode : "Status unknown." ));
        callback({});

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

      if ( object[path[child]] ) {

        object = object[path[child]];

      } else {

        console.log("Valid path check error. " + path[child] + " not in " + object);
        return false

      }

    }

    return object;

  }

  static JSONParseWrapper(string) {

    var parsed;

    try {

      parsed = JSON.parse(string);

    } catch(e) {

      console.log("Could not parse: " + string);
      return false;

    }

    return parsed;

  }

}

module.exports = Utils;
