module.exports = {

  fhir_server: {

    URL: "https://" + process.env.FHIR_SERVER_ADDRESS + "/hapi/fhir",

  },

  provenance_server: {

    // TODO: Add proxy entry.
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
