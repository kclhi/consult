module.exports = {

  mattermost: {
    WEBHOOK: process.env.MATTERMOST_WEBHOOK,
  	ADMIN_USERNAME: process.env.MATTERMOST_ADMIN_USERNAME,
  	ADMIN_PASSWORD: process.env.MATTERMOST_ADMIN_PASSWORD,
    API_PATH: "/api/v4",
  },

  dialogue_manager: {
    TEMPLATE_REGEX: "\\[[a-zA-Z0-9\\\\\.\\*]*\\]"
  },

  chatbot: {
    COMMAND: "hello",
    USERNAME: "connie",
    AVATAR: "consult.png",
    ERROR_TEXT: "Sorry, we aren't able to process a response for you right now."
  }

};
