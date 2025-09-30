const { MessageFlags } = require("discord.js");
const { logger } = require("./logger");

async function handleError(interaction, error, customMessage = null) {
  logger.error("Command error:", {
    command: interaction.commandName,
    user: interaction.user.tag,
    guild: interaction.guild?.name,
    error: error.message,
    stack: error.stack,
  });

  const errorMessage =
    customMessage || "There was an error while executing this command!";

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: errorMessage,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: errorMessage,
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (followUpError) {
    logger.error("Failed to send error message:", followUpError);
  }
}

module.exports = { handleError };
