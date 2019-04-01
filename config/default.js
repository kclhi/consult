module.exports = {

  credentials: {
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD,
  },

  fhir_server: {
    REST_ENDPOINT: "/"
  },

  provenance_server: {
    TRACK: false
  },

  dialogue_manager: {
    MAX_ALERT_PERIOD: 1
  },

  terminology: {
    HR_CODE: "8867-4",
  	BP_CODE: "85354-9",
    ECG_CODE: "131328"
  }

};
