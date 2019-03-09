module.exports = {
  GARMIN_CONSUMER_KEY: process.env.GARMIN_CONSUMER_KEY,
  GARMIN_SECRET: process.env.GARMIN_SECRET,
  USERNAME: process.env.USERNAME,
  PASSWORD: process.env.PASSWORD,
  SENSOR_TO_FHIR_URL: 'http://localhost:3001/',
  MESSAGE_QUEUE: true,
  RABBIT_QUEUE: "device-integration_garmin-sensor-fhir-mapper"
};
