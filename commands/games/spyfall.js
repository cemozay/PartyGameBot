const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

let gameCreated = false;
let gameCreaterId = null;
let gameStarted = false;
let players = [];
let locations = [];
let selectedLocation = null;
let spy = null;

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
        .setDescription("Add an location to the game.")
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
        await interaction.reply({
          content: "A game is already created!",
          flags: MessageFlags.Ephemeral,
        });
        return;
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
          .setCustomId("start_game")
          .setLabel("Start the Game")
          .setStyle(ButtonStyle.Success)
          .setDisabled(interaction.user.id !== gameCreaterId),
        new ButtonBuilder()
          .setCustomId("end_game")
          .setLabel("End the Game")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(interaction.user.id !== gameCreaterId),
        new ButtonBuilder()
          .setCustomId("reveal_yourself")
          .setLabel("Reveal Yourself")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("show_locations")
          .setLabel("Show Locations")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        content: "Welcome to Spyfall! Choose an action:",
        components: [row],
      });

      const filter = (i) =>
        [
          "join_game",
          "start_game",
          "end_game",
          "reveal_yourself",
          "show_locations",
        ].includes(i.customId);

      const collector = interaction.channel.createMessageComponentCollector({
        filter,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "join_game") {
          if (gameStarted) {
            await i.reply({
              content: "The game has already started!",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          if (!players.some((player) => player.id === i.user.id)) {
            players.push({ id: i.user.id, username: i.user.username });
            await i.reply({
              content: "You have joined the game!",
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await i.reply({
              content: "You have already joined the game!",
              flags: MessageFlags.Ephemeral,
            });
          }
        } else if (i.customId === "start_game") {
          if (gameStarted) {
            await i.reply({
              content: "The game has already started!",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
          if (players.length < 3) {
            await i.reply({
              content: "You need at least 3 players to start the game!",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          spy = players[Math.floor(Math.random() * players.length)];

          shuffleArray(locations);
          selectedLocation = locations[locations.length - 1];
          locations.pop(); // Remove the selected location from the list

          for (const player of players) {
            if (player.id !== spy.id) player.location = selectedLocation;
          }

          gameStarted = true;
          await i.reply({
            content: "The game has started! Good luck!",
          });
        } else if (i.customId === "end_game") {
          gameStarted = false;
          players = [];
          selectedLocation = null;
          spy = null;

          await i.reply({
            content: "The game has ended!",
          });
        } else if (i.customId === "reveal_yourself") {
          if (!gameStarted) {
            await i.reply({
              content: "The game has not started yet!",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const player = players.find((player) => player.id === i.user.id);

          if (player) {
            if (player.id === spy.id) {
              await i.reply({
                content: "You are the spy!",
                flags: MessageFlags.Ephemeral,
              });
            } else {
              await i.reply({
                content: `You are at the ${player.location}!`,
                flags: MessageFlags.Ephemeral,
              });
            }
          } else {
            await i.reply({
              content: "You are not in the game!",
              flags: MessageFlags.Ephemeral,
            });
          }
        } else if (i.customId === "show_locations") {
          if (locations.length === 0) {
            await i.reply({
              content: "No locations have been added to the game!",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const allLocations = [...locations, selectedLocation];

          await i.reply({
            content: `Locations in the game: ${allLocations.join(", ")}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      });
    } else if (subcommand === "add") {
      if (!gameCreated) {
        await interaction.reply({
          content:
            "No game is currently in progress. Create one with `/spyfall create`.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const location = interaction.options
        .getString("location")
        .trim()
        .toLowerCase();

      if (!location) {
        await interaction.reply({
          content: "Location cannot be empty or just spaces.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (locations.includes(location)) {
        await interaction.reply({
          content: `"${location}" is already in the game!`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      locations.push(location);

      await interaction.reply({
        content: `Added "${location}" to the game!`,
        flags: MessageFlags.Ephemeral,
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
