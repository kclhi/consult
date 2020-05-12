const async = require('async');
const { v1: uuidv1 } = require('uuid');
const logger = require('../config/winston');
const request = require('request');
const config = require('config');

const utils = require('./utils');

class Medi {

  static getAndForward(patientId, practitionerId, patchId, messageObject) {

    request.post(config.get("vitalpatch.URL"), {

			json: {
				"patchId": patchId,
				"licenseKey": config.get("vitalpatch.LICENSE_KEY"),
				"apiKey": config.get("vitalpatch.API_KEY")
      },

    }, function(error, response, body) {

      logger.debug("Polling for Vitalpatch info...");

			if ( !error && ( response && response.statusCode == 200 ) && body && body.files ) {

				var arr = body.files.map(a => a.ecgFile).sort();
				var arr_offline = arr.filter(w => w.includes("_OFFLINE_"));
				var arr_other   = arr.filter(w => ! w.includes("_OFFLINE_"));
				var arr_out = arr_other;
				var outputMsgs = [];

				for (var w in arr_out) outputMsgs.push({url:arr_out[w],payload:arr_out[w]});

				request.get(outputMsgs[0].payload, function(error, response, body) {

          if ( !error && response.statusCode <= 201 && body ) {

  					var timestampsAndValues = body.split(/[\n,]+/);
            var currentTimestamp = Math.trunc(timestampsAndValues[0] / 1000);
  					var currentECGSegement = [];
  					var allECGSegements = {};

  					for ( var i = 0; i < timestampsAndValues.length - 1; i = i + 2 ) {

  						var unixTimestamp = Math.trunc(timestampsAndValues[i] / 1000);

  						if ( unixTimestamp != currentTimestamp && currentECGSegement.length > 0 ) {

  							allECGSegements[currentTimestamp] = currentECGSegement;
  							currentTimestamp = unixTimestamp;
  							currentECGSegement = [];

  						} else {

  							currentECGSegement.push(timestampsAndValues[i+1])

  						}

  					}

            logger.debug("Sending collected data...");

  					async.eachSeries(Object.keys(allECGSegements), function(timestamp, done) {

  						var rawData = utils.replaceAll(allECGSegements[timestamp].toString(), ",", " ")

  						var json = {
  							"reading": "ECG",
  							"id": "v" + timestamp,
  							"subjectReference": patientId,
  							"practitionerReference": practitionerId,
  							"data": rawData,
  							"effectiveDateTime": new Date(timestamp * 1000)
  						};

  						messageObject.send(config.get('sensor_to_fhir.URL') + "/create/ecg", json).then(() => done());

  					}, function(ecgError) {

  						if (ecgError) logger.error(ecgError);
  						return 200;

  					});

          } else {

            logger.error("Error when getting additional payload: " + error + " " + ( ( body && typeof body === "object" ) ? JSON.stringify(body) : body ) + " " + ( response && response.statusCode ? response.statusCode : "Status unknown." ));
            return 400;

          }

				});

			} else {

				logger.error("Could not acquire ECG data. " + error + " " + ( response && response.body && typeof response.body === 'object' ? JSON.stringify(response.body) : "" ) + " " + ( response && response.statusCode ? response.statusCode : "" ));
				return 301;

			}

    });

  }

}

module.exports = Medi;
