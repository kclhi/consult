module.exports = {

  fhir_server: {
    // On different host, which is supplied in ENV by docker-compose.
    URL: "https://" + process.env.FHIR_SERVER_ADDRESS + "/hapi/fhir",
  },

  ldap_server: {
    HOST: process.env.LDAP_ADDRESS,
    PROTOCOL: "ldaps"
  },

  provenance_server: {
    // TODO: Add proxy entry to facilitate service discovery.
    URL: "http://message-passer_template-server_1:8080",
    TRACK: false
  },

  data_miner: {
    URL: "https://" + process.env.PROCESSING_ADDRESS + "/mine",
  },

  dialogue_manager: {
    URL: "https://" + process.env.DNC_ADDRESS  + "/dialogue",
  }

};
