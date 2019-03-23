module.exports = {
	FHIR_SERVER_URL: "https://device-integration_nokia_proxy_1/hapi/fhir/", // Replace with remote addrss of FHIR server.
	FHIR_REST_ENDPOINT: "",
	FHIR_USERNAME: process.env.FHIR_USERNAME,
	FHIR_PASSWORD: process.env.FHIR_PASSWORD,
	RABBIT_HOST: "sensor-fhir-mapper_rabbit_1",
	RABBIT_QUEUES: ["device-integration_nokia-sensor-fhir-mapper", "device-integration_garmin-sensor-fhir-mapper"]
};
