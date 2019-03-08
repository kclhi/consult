const fs = require('fs');

const utils = require('../lib/utils');
const config = require('../lib/config');

class fhir {

  static createFHIRResource(reading, data, callback) {

    // TODO: Create patient resource if does not exist (assume default Practitioner and Organization already in system).

    var template = fs.readFileSync("fhir-json-templates/" + reading + ".json", 'utf8');

    template = template.replace("[effectiveDateTime]", new Date().toISOString());

    Object.keys(data).forEach(function(key) {

      template = template.replace("[" + key + "]", data[key]);

    });

    utils.callFHIRServer(config.FHIR_SERVER_URL + config.FHIR_REST_ENDPOINT + "Observation/" + data["id"] + "?_format=json", "PUT", template, function(statusCode) {

      callback(statusCode)

    });

  }

}

module.exports = fhir;
