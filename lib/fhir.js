const fs = require('fs');

const utils = require('../lib/utils');
const config = require('../lib/config');

class fhir {

  static createObservationResource(template, data, callback) {

    this.createFHIRResourceFromTemplate("Observation", template, data, callback);

  }

  static createFHIRResource(template, data, callback) {

    this.createFHIRResourceFromTemplate(template, template, data, callback);

  }

  static createFHIRResourceFromTemplate(resource, template, data, callback) {

    var template = fs.readFileSync("./fhir-json/templates/" + template + ".json", 'utf8');

    template = template.replace("[effectiveDateTime]", new Date().toISOString());

    Object.keys(data).forEach(function(key) {

      template = template.replace("[" + key + "]", data[key]);

    });

    utils.callFHIRServer(config.FHIR_SERVER_URL + config.FHIR_REST_ENDPOINT + resource + "/" + data["id"] + "?_format=json", "PUT", template, function(statusCode) {

      callback(statusCode)

    });

  }

}

module.exports = fhir;
