module.exports = {

  fhir_server: {
    URL: "https://" + process.env.FHIR_SERVER_ADDRESS + "/hapi/fhir",
    REST_ENDPOINT: "/"
  },

  message_queue: {
    HOST: "sensor-fhir-converter_rabbit_1",
  	QUEUES: ["device-integration_nokia-sensor-fhir-converter", "device-integration_garmin-sensor-fhir-converter", "device-integration_vitalpatch-sensor-fhir-converter"]
  }

};
