const request = require('request');
const config = require('config');
const utils = require('../lib/utils');
const logger = require('../config/winston');
const async = require('async');

class Patient {

  static callFHIRServer(query, params, callback) {

    utils.callFHIRServer(query, params, callback, config.get('fhir_server.USERNAME'), config.get('fhir_server.PASSWORD'));

  }

  static getPatientStats(patientID, callback) {

    var patientHeaders = [];
    var patientRow = [];

    this.callFHIRServer("Patient/" + patientID, "", function(patientData) {

      var parsedPatientData;
      if ( parsedPatientData = utils.JSONParseWrapper(patientData) ) {

        var birthDate;
        if ( birthDate = parsedPatientData.birthDate ) {

          patientHeaders.push("birthDate");
          patientRow.push(birthDate);
          patientHeaders.push("age");
          patientRow.push(utils.calculateAge(new Date(birthDate)));

          var ethnicity;
          if ( ethnicity = utils.validPath(parsedPatientData, ["extension", "0", "extension", "0", "valueCoding", "display"] ) ) {

            patientHeaders.push("ethnicity");
            patientRow.push(ethnicity);

            Patient.callFHIRServer("MedicationDispense", "subject=" + patientID, function(medicationDispenseData) {

              var parsedMedicationDispenseData;
              if ( ( parsedMedicationDispenseData = utils.JSONParseWrapper(medicationDispenseData) ) && parsedMedicationDispenseData.entry ) {

                // TODO: Remove async.
                async.each(parsedMedicationDispenseData.entry, function(medicationDispense, done) {

                  var medicationReference;
                  if ( medicationReference = utils.validPath(medicationDispense, ["resource", "medicationReference", "reference"]) ) {

                    Patient.callFHIRServer(medicationReference, "", function(medicationData) {

                      var parsedMedicationData, medicationName;
                      if ( ( parsedMedicationData = utils.JSONParseWrapper(medicationData) ) && ( medicationName = utils.validPath(parsedMedicationData, ["code", "coding", "0", "display"]) ) ) {

                        patientHeaders.push("medication" + (parsedMedicationDispenseData.entry.findIndex(jsonObject => jsonObject.fullUrl == medicationDispense.fullUrl) + 1));
                        patientRow.push(medicationName);
                        done();

                      } else {

                        utils.noParse("medication name", ["code", "coding", "0", "display"], medicationData);
                        done();

                      }

                    });

                  } else {

                    utils.noParse("medication reference", ["resource", "medicationReference", "reference"], medicationDispense);
                    done();

                  }

                }, function(medicationDispenseDataError) {

                  Patient.callFHIRServer("Condition", "subject=" + patientID, function(conditionData) {

                    var problem = 1;
                    var parsedConditionData;
                    if ( ( parsedConditionData = utils.JSONParseWrapper(conditionData) ) && parsedConditionData.entry ) {

                      parsedConditionData.entry.forEach(function(condition) {

                        var conditionName;
                        if ( conditionName = utils.validPath(condition, ["resource", "code", "coding", "0", "display"]) ) {

                          patientHeaders.push("problem" + problem)
                          problem += 1;
                          patientRow.push(conditionName);

                        } else {

                          utils.noParse("condition data", ["resource", "code", "coding", "0", "display"], conditionData);
                          callback(patientHeaders, patientRow);

                        }

                      });

                    }

                    callback(patientHeaders, patientRow);

                  });

                });

              } else {

                utils.noParse("medication dispense data", [], medicationDispenseData);
                callback(patientHeaders, patientRow);

              }

            });

          } else {

            utils.noParse("patient ethnicity", ["extension", "0", "extension", "0", "valueCoding", "display"], patientData);
            callback(patientHeaders, patientRow);

          }

        } else {

          utils.noParse("patient birth date", [], patientData);
          callback(patientHeaders, patientRow);

        }

      } else {

        utils.noParse("patient data", [], patientData);
        callback(patientHeaders, patientRow);

      }

    });

  }

}

module.exports = Patient;
