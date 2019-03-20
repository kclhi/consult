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

        var response = "";

        if ( error ) response += "Error: " + error;

        if ( response && response.statusCode >= 400 ) response += "Status: " + response.statusCode;

        if ( response == "" ) response = body;

        callback(response);

    });

  }

  static dayOfWeekAsString(dayIndex) {

    return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex];

  }

  static replaceAll(str, find, replace) {

    return str.replace(new RegExp(find, 'g'), replace);

  }

}

module.exports = Utils;
