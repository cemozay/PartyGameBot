const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

let gameCreated = false;
let gameCreaterId = null;
let gameStarted = false;
let players = [];
let locations = [];
let selectedLocation = null;
let spy = null;
let message = null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("spyfall")
    .setDescription("Play the 'Spyfall' game!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Creates a new game and allows players to join.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a location to the game.")
        .addStringOption((option) =>
          option
            .setName("location")
            .setDescription("The location you want to add.")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      if (gameCreated) {
        return interaction.reply({
          content: "A game is already created!",
          ephemeral: true,
        });
      }

      players = [];
      locations = [];
      gameCreated = true;
      gameCreaterId = interaction.user.id;
      gameStarted = false;
      selectedLocation = null;
      spy = null;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("join_game")
          .setLabel("Join the Game")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("leave_game")
          .setLabel("Leave the Game")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("reveal_yourself")
          .setLabel("Reveal Yourself")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("start_game")
          .setLabel("Start the Game")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("end_game")
          .setLabel("End this Round")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
      );

      const embed = new EmbedBuilder()
        .setTitle("Spyfall Game")
        .setDescription(
          "**Participants:** None yet!\n**Participants Count:** 0\n**Locations:** No locations yet!"
        )
        .setColor(0x1abc9c)
        .setFooter({ text: "Party Games Bot" });

      message = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });

      const filter = (i) =>
        [
          "join_game",
          "leave_game",
          "start_game",
          "end_game",
          "reveal_yourself",
        ].includes(i.customId);

      const collector = interaction.channel.createMessageComponentCollector({
        filter,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "join_game") {
          if (gameStarted) {
            return i.reply({
              content: "The game has already started!",
              ephemeral: true,
            });
          }

          if (!players.some((player) => player.id === i.user.id)) {
            players.push({ id: i.user.id, username: i.user.username });
            const participants =
              players.map((p) => p.username).join("\n") || "None yet!";
            const participantsCount = players.length;

            const updatedEmbed = new EmbedBuilder().setDescription(
              `**Participants:**\n${participants}\n**Participants Count:** ${participantsCount}\n**Locations:**\n${
                locations.length > 0
                  ? locations.join("\n")
                  : "No locations yet!"
              }`
            );

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("join_game")
                .setLabel("Join the Game")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId("leave_game")
                .setLabel("Leave the Game")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId("reveal_yourself")
                .setLabel("Reveal Yourself")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(false),
              new ButtonBuilder()
                .setCustomId("start_game")
                .setLabel("Start the Game")
                .setStyle(ButtonStyle.Success)
                .setDisabled(i.user.id !== gameCreaterId),
              new ButtonBuilder()
                .setCustomId("end_game")
                .setLabel("End this Round")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(i.user.id !== gameCreaterId)
            );

            await message.edit({ embeds: [updatedEmbed], components: [row] });
            return i.reply({
              content: "You have joined the game!",
              ephemeral: true,
            });
          }

          return i.reply({
            content: "You have already joined the game!",
            ephemeral: true,
          });
        }

        if (i.customId === "leave_game") {
          if (gameStarted) {
            return i.reply({
              content: "The game has already started!",
              ephemeral: true,
            });
          }

          const playerIndex = players.findIndex(
            (player) => player.id === i.user.id
          );
          if (playerIndex !== -1) {
            players.splice(playerIndex, 1);
            const participants =
              players.map((p) => p.username).join("\n") || "None yet!";
            const participantsCount = players.length;

            const updatedEmbed = new EmbedBuilder().setDescription(
              `**Participants:**\n${participants}\n**Participants Count:** ${participantsCount}\n**Locations:**\n${
                locations.length > 0
                  ? locations.join("\n")
                  : "No locations yet!"
              }`
            );

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("join_game")
                .setLabel("Join the Game")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId("leave_game")
                .setLabel("Leave the Game")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId("reveal_yourself")
                .setLabel("Reveal Yourself")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId("start_game")
                .setLabel("Start the Game")
                .setStyle(ButtonStyle.Success)
                .setDisabled(i.user.id !== gameCreaterId), // Only the creator can start the game
              new ButtonBuilder()
                .setCustomId("end_game")
                .setLabel("End this Round")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(i.user.id !== gameCreaterId) // Only the creator can end the game
            );

            await message.edit({ embeds: [updatedEmbed], components: [row] });
            return i.reply({
              content: "You have left the game!",
              ephemeral: true,
            });
          }

          return i.reply({
            content: "You are not in the game!",
            ephemeral: true,
          });
        }

        if (i.customId === "start_game") {
          if (gameStarted) {
            return i.reply({
              content: "The game has already started!",
              ephemeral: true,
            });
          }

          if (players.length < 3) {
            return i.reply({
              content: "You need at least 3 players to start the game!",
              ephemeral: true,
            });
          }

          spy = players[Math.floor(Math.random() * players.length)];

          shuffleArray(locations);
          selectedLocation = locations.pop();

          for (const player of players) {
            if (player.id !== spy.id) player.location = selectedLocation;
          }

          gameStarted = true;

          const updatedEmbed = new EmbedBuilder()
            .setTitle("Spyfall Game Started!")
            .setDescription(
              `The game has started! Good luck!\n\n**Location:** ${selectedLocation}`
            )
            .setColor(0x1abc9c);

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("join_game")
              .setLabel("Join the Game")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("leave_game")
              .setLabel("Leave the Game")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("reveal_yourself")
              .setLabel("Reveal Yourself")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(false),
            new ButtonBuilder()
              .setCustomId("start_game")
              .setLabel("Start the Game")
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("end_game")
              .setLabel("End this Round")
              .setStyle(ButtonStyle.Danger)
              .setDisabled(false)
          );

          await message.edit({ embeds: [updatedEmbed], components: [row] });
          return i.reply({
            content: "The game has started! Good luck!",
            ephemeral: true,
          });
        }

        if (i.customId === "end_game") {
          return i.reply({
            content:
              "The round has ended! The game continues, start a new round!",
            ephemeral: true,
          });
        }

        if (i.customId === "reveal_yourself") {
          if (!gameStarted) {
            return i.reply({
              content: "The game has not started yet!",
              ephemeral: true,
            });
          }

          const player = players.find((player) => player.id === i.user.id);
          if (player) {
            const embed = new EmbedBuilder()
              .setTitle(
                player.id === spy.id ? "Spy Revealed!" : "Your Location"
              )
              .setDescription(
                player.id === spy.id
                  ? "You are the **Spy**! 🕵️‍♂️ Your goal is to guess the location."
                  : `You are at the location: **${player.location}**`
              )
              .setColor(player.id === spy.id ? 0xe74c3c : 0x2ecc71)
              .setFooter({
                text:
                  player.id === spy.id
                    ? "Good luck, Spy!"
                    : "Keep the Spy guessing!",
              });

            return i.reply({
              embeds: [embed],
              ephemeral: true,
            });
          }

          return i.reply({
            content: "You are not in the game!",
            ephemeral: true,
          });
        }
      });
    } else if (subcommand === "add") {
      if (!gameCreated) {
        return interaction.reply({
          content:
            "No game is currently in progress. Create one with `/spyfall create`.",
          ephemeral: true,
        });
      }

      const location = interaction.options
        .getString("location")
        .trim()
        .toLowerCase();
      if (!location) {
        return interaction.reply({
          content: "Location cannot be empty or just spaces.",
          ephemeral: true,
        });
      }

      if (locations.includes(location)) {
        return interaction.reply({
          content: `"${location}" is already in the game!`,
          ephemeral: true,
        });
      }

      locations.push(location);

      const updatedEmbed = new EmbedBuilder().setDescription(
        `**Participants:**\n${
          players.map((p) => p.username).join("\n") || "None yet!"
        }\n**Participants Count:** ${
          players.length
        }\n**Locations:**\n${locations
          .map((loc, index) => `${index + 1}. ${loc}`)
          .join("\n")}`
      );

      await message.edit({ embeds: [updatedEmbed] });

      return interaction.reply({
        content: `"${location}" has been added to the game!`,
        ephemeral: true,
      });
    }
  },
};

function shuffleArray(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
