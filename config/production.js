module.exports = {

  dbConfig: {
    username: "user",
    password: "password",
    database: "database",
    host: "device-integration_vitalpatch_mariadb_1",
    dialect: "mysql"
  },

  sensor_to_fhir: {
    URL: "http://sensor-fhir-converter_webapp-queue_1:3002"
  },

  message_queue: {
    ACTIVE: true,
    HOST: "sensor-fhir-converter_rabbit_1",
    NAME: "device-integration_vitalpatch-sensor-fhir-converter"
  },

  vitalpatch: {
    LICENSE_KEY: process.env.PRODUCTION_VITALPATCH_LICENSE_KEY,
    API_KEY: process.env.PRODUCTION_VITALPATCH_API_KEY,
    URL: "https://us-central1-mbshealthstreamkcl.cloudfunctions.net/getEcgFilesByPatchId",
    POLL_INTERVAL: 5
  },

};
