module.exports = {

  fhir_server: {
    URL: "http://localhost:8080/hapi/fhir",
  },

  ldap_server: {
    HOST: "localhost",
    PROTOCOL: "ldap"
  },

  provenance_server: {
  	URL: "http://localhost:8081",
    TRACK: true
  },

  data_miner: {
    URL: "http://localhost:3006/mine",
  },

  dialogue_manager: {
    URL: "http://localhost:3007/dialogue",
  }

};
