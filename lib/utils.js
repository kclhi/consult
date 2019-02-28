const request = require('request');
const config = require('../lib/config.js');

class Util {

  static callFHIRServer(url, body, callback) {

    request(
      {
        method: "PUT",
        url : url,
        headers: {
         "Authorization": "Basic " + new Buffer(config.FHIR_USERNAME + ":" + config.FHIR_PASSWORD).toString("base64"),
         "Content-Type": "application/fhir+json; charset=UTF-8"
        },
        rejectUnauthorized: false,
        requestCert: true,
        body: body
      },
      function (error, response, body) {

        if (!error && response.statusCode == 201) {

          console.log(response.statusCode);
          callback(200);

        } else {

          console.log(error);
          callback(200);

        }

      }

    );

  }

}

module.exports = Util;
