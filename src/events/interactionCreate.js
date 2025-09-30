const { Events } = require("discord.js");
const { handleError } = require("../utils/errorHandler");
const { logger } = require("../utils/logger");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        logger.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        await command.execute(interaction);
        logger.info(
          `Command executed: ${interaction.commandName} by ${interaction.user.tag}`
        );
      } catch (error) {
        await handleError(interaction, error);
      }
    }
  },
};
