module.exports = {
	FHIR_SERVER_URL: "https://" + process.env.FHIR_SERVER_ADDRESS + "/hapi/fhir/",
	FHIR_REST_ENDPOINT: "",
	FHIR_USERNAME: process.env.FHIR_USERNAME,
	FHIR_PASSWORD: process.env.FHIR_PASSWORD,
	RABBIT_HOST: "sensor-fhir-mapper_rabbit_1",
	RABBIT_QUEUES: ["device-integration_nokia-sensor-fhir-mapper", "device-integration_garmin-sensor-fhir-mapper"]
};
