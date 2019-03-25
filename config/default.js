module.exports = {

  mattermost: {
    WEBHOOK: process.env.MATTERMOST_WEBHOOK,
  	ADMIN_USERNAME: process.env.MATTERMOST_ADMIN_USERNAME,
  	ADMIN_PASSWORD: process.env.MATTERMOST_ADMIN_PASSWORD,
    API_PATH: "/api/v4",
    CHAT_EXTERNAL_URL: "https://localhost/chat",
    CHAT_INTERNAL_URL: "https://localhost/chat"
  },

  dialogue_manager: {
    // Assumes local running proxy routing to dialogue manager.
  	URL: "http://localhost/dialogue"
  }

};
