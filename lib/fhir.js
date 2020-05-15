const fs = require('fs');
const config = require('config');
const { v1: uuidv1 } = require('uuid');

const utils = require('../lib/utils');

class FHIR {

  static createAuditEventResource(server, endpoint, template, data, callback, username="", password="") {

    this.createFHIRResourceFromTemplate(server, endpoint, "AuditEvent", template, data, callback, username, password);

  }

  static createQuestionnaireResponseResource(server, endpoint, template, data, callback, username="", password="") {

    this.createFHIRResourceFromTemplate(server, endpoint, "QuestionnaireResponse", template, data, callback, username, password);

  }

  static createClinicalImpressionResource(server, endpoint, template, data, callback, username="", password="") {

    this.createFHIRResourceFromTemplate(server, endpoint, "ClinicalImpression", template, data, callback, username, password);

  }

  static createObservationResource(server, endpoint, template, data, callback, username="", password="") {

    this.createFHIRResourceFromTemplate(server, endpoint, "Observation", template, data, callback, username, password);

  }

  static createFHIRResource(server, endpoint, template, data, callback) {

    this.createFHIRResourceFromTemplate(server, endpoint, template, template, data, callback, username, password);

  }

  static createFHIRResourceFromTemplate(server, endpoint, resource, template, data, callback, username="", password="") {

    if ( template ) {

      var template = fs.readFileSync("./fhir-json/templates/" + template + ".json", 'utf8');

      if ( Object.keys(data).indexOf("effectiveDateTime") < 0 ) {

        template = utils.replaceAll(template, "\\[effectiveDateTime\\]", new Date().toISOString());

      }

      if ( Object.keys(data).indexOf("id") < 0 ) {

        data["id"] = uuidv1();

      }

      Object.keys(data).forEach(function(key) {

        template = utils.replaceAll(template, "\\[" + key + "\\]", data[key]);

      });

      var missingSubstitutions;
      if ( ( missingSubstitutions = template.match(/\"\[[A-Za-z0-9]*\]\"/g) ) && ( missingSubstitutions.length > 0 ) ) {

        console.log("Missing substitutions in FHIR resource template, not adding: " + missingSubstitutions);
        callback(400);

      } else {

        const URL = server + endpoint + resource + "/" + data["id"] + "?_format=json";

        utils.callFHIRServer(URL, "PUT", template, function(statusCode) {

          callback(statusCode)

        }, username, password);

      }

    } else {

      console.log("Could not find specified FHIR resource template: " + template);
      callback(400);

    }

  }

}

module.exports = FHIR;
