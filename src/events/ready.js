const { Events } = require("discord.js");
const { logger } = require("../utils/logger");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guilds`);

    // Set bot activity
    client.user.setActivity("Party Games! Use /help", { type: "PLAYING" });
  },
};
