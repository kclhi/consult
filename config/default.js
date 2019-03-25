module.exports = {

  credentials: {

    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD,

  },

  fhir_server: {

    URL: "https://localhost/hapi/fhir",
    REST_ENDPOINT: "/"

  },

  provenance_server: {

    // TODO: Add proxy entry.
  	URL: "http://localhost:8080",
    TRACK: false

  },

  data_miner: {

    URL: "https://localhost/mine",

  },

  dialogue_manager: {

    URL: "https://localhost/dialogue",
    MAX_ALERT_PERIOD: 1

  },
  
  terminology: {

    HR_CODE: "8867-4",
  	BP_CODE: "85354-9",

  }

};
