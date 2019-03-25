module.exports = {

  fhir_server: {
    URL: "https://localhost/hapi/fhir",
    REST_ENDPOINT: "/",
  	USERNAME: process.env.FHIR_USERNAME,
  	PASSWORD: process.env.FHIR_PASSWORD
  },

  message_queue: {
    HOST: "localhost",
  	QUEUES: ["device-integration_nokia-sensor-fhir-mapper", "device-integration_garmin-sensor-fhir-mapper"]
  }

};
