module.exports = {

  credentials: {
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD
  },

  garmin: {
    CONSUMER_KEY: process.env.GARMIN_CONSUMER_KEY,
    SECRET: process.env.GARMIN_SECRET
  },

  sensor_to_fhir: {
    URL: 'http://localhost/populate',
  },

  message_queue: {
    ACTIVE: true,
    HOST: "localhost",
    NAME: "device-integration_garmin-sensor-fhir-mapper"
  }

};
