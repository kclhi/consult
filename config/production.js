module.exports = {

  fhir_server: {
    URL: "https://" + process.env.FHIR_SERVER_ADDRESS + "/hapi/fhir",
    REST_ENDPOINT: "/",
  	USERNAME: process.env.FHIR_USERNAME,
  	PASSWORD: process.env.FHIR_PASSWORD
  },
  
  message_queue: {
    HOST: "sensor-fhir-mapper_rabbit_1",
  	QUEUES: ["device-integration_nokia-sensor-fhir-mapper", "device-integration_garmin-sensor-fhir-mapper"]
  }

};
