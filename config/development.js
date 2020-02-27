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
    TRACK: true,
    NR_CHAIN_URL_PORT: 10000,
    NR_BUCKET_URL_PORT: 10001,
    NR_SELINUX_URL_PORT: 10002
  },

  data_miner: {
    URL: "http://localhost:3006/mine",
  },

  dialogue_manager: {
    URL: "http://localhost:3007/dialogue",
  },

  argumentation_engine: {
    URL: "http://localhost:5000/argengine",
  }

};
