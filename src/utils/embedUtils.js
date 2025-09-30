const { EmbedBuilder } = require("discord.js");

function createGameEmbed(
  title,
  description,
  color = 0x1abc9c,
  fields = [],
  footer = "Party Games Bot"
) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();

  if (footer) {
    embed.setFooter({ text: footer });
  }

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

function createSuccessEmbed(title, description) {
  return createGameEmbed(title, description, 0x00ff00);
}

function createErrorEmbed(title, description) {
  return createGameEmbed(title, description, 0xff0000);
}

function createWarningEmbed(title, description) {
  return createGameEmbed(title, description, 0xffaa00);
}

function createInfoEmbed(title, description) {
  return createGameEmbed(title, description, 0x3498db);
}

function formatPlayerList(players, maxDisplay = 10) {
  if (players.size === 0) return "None yet!";

  const playerArray = Array.from(players.values());
  const displayPlayers = playerArray.slice(0, maxDisplay);

  let result = displayPlayers.map((p) => `<@${p.id}>`).join(", ");

  if (playerArray.length > maxDisplay) {
    result += ` and ${playerArray.length - maxDisplay} more...`;
  }

  return result;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
  createGameEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  createWarningEmbed,
  createInfoEmbed,
  formatPlayerList,
  shuffleArray,
  getRandomElement,
};
