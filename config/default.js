module.exports = {

  credentials: {
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD
  },

  vitalpatch: {
    LICENSE_KEY: process.env.VITALPATCH_LICENSE_KEY,
    API_KEY: process.env.VITALPATCH_API_KEY,
    URL: "https://us-central1-mbshealthstream.cloudfunctions.net/getEcgFilesByPatchId",
    POLL_INTERVAL: 1
  },

  ehr: {
    DEFAULT_PRACTITIONER_ID: "da6da8b0-56e5-11e9-8d7b-95e10210fac3"
  }

};
