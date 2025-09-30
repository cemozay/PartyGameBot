const { SlashCommandBuilder } = require("discord.js");
const { createInfoEmbed } = require("../../utils/embedUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available commands and how to play games"),

  async execute(interaction) {
    const embed = createInfoEmbed(
      "🎮 Party Games Bot Help",
      "Welcome to Party Games Bot! Here are the available games and commands:"
    );

    embed.addFields([
      {
        name: "🕵️ Spyfall",
        value:
          "`/spyfall create` - Create a new Spyfall game\n`/spyfall add <location>` - Add a location to the game",
        inline: true,
      },
      {
        name: "❓ Who Am I?",
        value:
          "`/whoami start` - Start a Who Am I game\n`/whoami assign <player> <identity>` - Assign an identity",
        inline: true,
      },
      {
        name: "🎯 Truth or Dare",
        value:
          "`/truthordare start` - Start a Truth or Dare game\n`/truthordare spin` - Spin to get a truth or dare",
        inline: true,
      },
      {
        name: "📝 Word Association",
        value:
          "`/wordchain start` - Start a word association game\n`/wordchain <word>` - Add a word to the chain",
        inline: true,
      },
    ]);

    embed.addFields([
      {
        name: "📋 How to Play",
        value:
          "Each game has detailed instructions when you start it. Most games support multiple players and have interactive buttons for easy gameplay!",
        inline: false,
      },
    ]);

    await interaction.reply({ embeds: [embed] });
  },
};
