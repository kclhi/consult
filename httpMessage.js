const request = require('request');

// Send message via http
class HTTPMessage {

  send(url, body) {

    return new Promise((resolve, reject) => {

        request.post(url, { json: body }, function(error, response, data) {

          if (!error && response.statusCode == 200) {

            console.log(JSON.stringify(response.body));
            resolve(response.body);

          } else {

            console.log("Error sending message to HTTP endpoint: " + url + ". Response body: " + JSON.stringify(response.body) + ". Error: " + error + ". Sent body: " + JSON.stringify(body) + ".");
            resolve(error);

          }

       });

    });

  }

}

module.exports = HTTPMessage;
