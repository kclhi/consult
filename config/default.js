module.exports = {

  mattermost: {
    WEBHOOK: process.env.MATTERMOST_WEBHOOK,
  	ADMIN_USERNAME: process.env.MATTERMOST_ADMIN_USERNAME,
  	ADMIN_PASSWORD: process.env.MATTERMOST_ADMIN_PASSWORD,
    API_PATH: "/api/v4",
  }

};
