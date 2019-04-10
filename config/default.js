module.exports = {

  credentials: {
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD,
    SECRET: process.env.SECRET
  },

  ldap_server: {
    MANAGER_PASSWORD: process.env.LDAP_MANAGER_PASSWORD
  },

  fhir_server: {
    REST_ENDPOINT: "/",
    USERNAME: process.env.FHIR_USERNAME,
    PASSWORD: process.env.FHIR_PASSWORD
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
  },

  companies: {
    BP: "Nokia",
    HR: "Garmin"
  },

  user_registration: {
    ENABLED: false
  }

};
