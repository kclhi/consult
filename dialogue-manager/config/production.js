module.exports = {

  mattermost: {
    // Populate with domain name information, as this is what will be received back as part of the webhook, and will need to be altered for an internal call.
    CHAT_INTERNAL_URL: "https://" + process.env.UI_INTERNAL_ADDRESS + "/chat",
    CHAT_EXTERNAL_URL: "https://" + process.env.UI_ADDRESS + "/chat"
  },

  dialogue_manager: {
  	URL: "https://" + process.env.DNC_ADDRESS + "/dialogue",
    STATIC: false
  },

  message_passer: {
    URL: "http://message-passer_webapp_1:3005",
  }

};
