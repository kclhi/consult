const fs = require('fs');
const config = require('config');

const utils = require('../lib/utils');


class FHIR {

  static createObservationResource(server, endpoint, template, data, callback) {

    this.createFHIRResourceFromTemplate(server, endpoint, "Observation", template, data, callback);

  }

  static createFHIRResource(server, endpoint, template, data, callback) {

    this.createFHIRResourceFromTemplate(server, endpoint, template, template, data, callback);

  }

  static createFHIRResourceFromTemplate(server, endpoint, resource, template, data, callback) {

    var template = fs.readFileSync("./fhir-json/templates/" + template + ".json", 'utf8');

    if ( Object.keys(data).indexOf("effectiveDateTime") < 0 ) {

      template = template.replace("[effectiveDateTime]", new Date().toISOString());

    }

    Object.keys(data).forEach(function(key) {

      template = template.replace("[" + key + "]", data[key]);

    });

    const URL = server + endpoint + resource + "/" + data["id"] + "?_format=json";

    utils.callFHIRServer(URL, "PUT", template, function(statusCode) {

      callback(statusCode)

    });

  }

}

module.exports = FHIR;
