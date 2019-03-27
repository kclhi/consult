const request = require('request');
const config = require('config');

class Util {

  static callFHIRServer(url, method, body, callback, username="", password="") {

    request({
      method: method,
      url : url,
      headers: {
       "Authorization": "Basic " + new Buffer(username + ":" + password).toString("base64"),
       "Content-Type": "application/fhir+json; charset=UTF-8"
      },
      body: body,
      requestCert: true
    },
    function (error, response, body) {

      if (!error && response.statusCode == 201) {

        callback(200);

      } else {

        console.error("Cannot contact FHIR server: " + error + " " + ( ( body && typeof body === "object" ) ? JSON.stringify(body) : body ) + " " + ( response && response.statusCode ? response.statusCode : "Status unknown." ));
        callback(400);

      }

    });

  }

}

module.exports = Util;
