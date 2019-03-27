module.exports = {

  fhir_server: {
    URL: "http://localhost:8080/hapi/fhir",
    REST_ENDPOINT: "/",
  	USERNAME: process.env.FHIR_USERNAME,
  	PASSWORD: process.env.FHIR_PASSWORD
  },

  message_queue: {
    ACTIVE: false
  }

};
