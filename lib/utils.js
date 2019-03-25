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
      rejectUnauthorized: false,
      requestCert: true,
      body: body
    },
    function (error, response, body) {

      if (!error && response.statusCode == 201) {

        callback(200);

      } else {

        console.log("Error: " + error + " " + response + " " + body);
        callback(400);

      }

    });

  }

}

module.exports = Util;
