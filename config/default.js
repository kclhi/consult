module.exports = {

  simulate: {
    TIME_SHIFT: true
  },

  credentials: {
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD
  },

  vitalpatch: {
    LICENSE_KEY: process.env.DEVELOPMENT_VITALPATCH_LICENSE_KEY,
    API_KEY: process.env.DEVELOPMENT_VITALPATCH_API_KEY,
    URL: process.env.DEVELOPMENT_VITALPATCH_URL,
    POLL_INTERVAL: 30,
    DEFAULT_PATCH_ID: process.env.DEFAULT_PATCH_ID
  },

  ehr: {
    DEFAULT_PRACTITIONER_ID: "da6da8b0-56e5-11e9-8d7b-95e10210fac3"
  }

};
