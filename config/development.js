module.exports = {

  mattermost: {
    // Populate with domain name information, as this is what will be received back as part of the webhook, and will need to be altered for an internal call.
    CHAT_EXTERNAL_URL: "http://localhost:8000",
    CHAT_INTERNAL_URL: "http://localhost:8000"
  },

  dialogue_manager: {
  	URL: "http://localhost:3007/dialogue",
    STATIC: true
  }

};
