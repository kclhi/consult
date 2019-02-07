module.exports = {
	MANAGER_URL: "http://localhost:3004/dialogue/response",
	CHAT_EXTERNAL_URL: "https://consult.hscr.kcl.ac.uk",
	CHAT_INTERNAL_URL: "http://localhost:8065",
	// Should be registered by an admin 'stroke_companion' user.
	MATTERMOST_WEBHOOK: process.env.MATTERMOST_WEBHOOK
};
