module.exports = {
	MANAGER_URL: "http://dialogue-manager_webapp_1:3007/dialogue",
	API_PATH: "/api/v4",
	CHAT_EXTERNAL_URL: "https://consult.hscr.kcl.ac.uk/chat",
	CHAT_INTERNAL_URL: "https://device-integration_nokia_proxy_1/chat",
	MATTERMOST_WEBHOOK: process.env.MATTERMOST_WEBHOOK,
	MATTERMOST_ADMIN_USERNAME: process.env.MATTERMOST_ADMIN_USERNAME,
	MATTERMOST_ADMIN_PASSWORD: process.env.MATTERMOST_ADMIN_PASSWORD
};
