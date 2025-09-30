const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { GameManager } = require("../../utils/gameManager");
const {
  createGameEmbed,
  createErrorEmbed,
  formatPlayerList,
  getRandomElement,
} = require("../../utils/embedUtils");
const { handleError } = require("../../utils/errorHandler");

const gameManager = new GameManager();

// Predefined locations for quick setup
const defaultLocations = [
  "Airport",
  "Bank",
  "Beach",
  "Casino",
  "Church",
  "Circus",
  "Hospital",
  "Hotel",
  "Library",
  "Movie Theater",
  "Museum",
  "Restaurant",
  "School",
  "Space Station",
  "Submarine",
  "Zoo",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("spyfall")
    .setDescription("Play the 'Spyfall' game!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Creates a new Spyfall game")
        .addBooleanOption((option) =>
          option
            .setName("use_defaults")
            .setDescription("Use default locations (faster setup)")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a location to the game")
        .addStringOption((option) =>
          option
            .setName("location")
            .setDescription("The location you want to add")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("rules").setDescription("Show how to play Spyfall")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "rules") {
        const embed = createGameEmbed(
          "🕵️ How to Play Spyfall",
          "Spyfall is a social deduction game where players try to find the spy among them!"
        );

        embed.addFields([
          {
            name: "Setup",
            value:
              "• One player creates a game and adds locations\n• Players join the game\n• When started, everyone gets the same location except one spy",
            inline: false,
          },
          {
            name: "Gameplay",
            value:
              "• Players ask each other questions about the location\n• The spy tries to figure out the location\n• Others try to identify the spy\n• The spy can reveal themselves to guess the location",
            inline: false,
          },
          {
            name: "Winning",
            value:
              "• **Spy wins:** If they correctly guess the location\n• **Players win:** If they identify the spy or spy guesses wrong",
            inline: false,
          },
        ]);

        return await interaction.reply({ embeds: [embed] });
      }

      if (subcommand === "create") {
        const useDefaults =
          interaction.options.getBoolean("use_defaults") ?? false;

        if (gameManager.isGameActive("spyfall", interaction.channelId)) {
          const embed = createErrorEmbed(
            "Game Already Active",
            "A Spyfall game is already running in this channel!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const locations = useDefaults ? [...defaultLocations] : [];
        const game = gameManager.createGame(
          "spyfall",
          interaction.channelId,
          interaction.user.id,
          {
            locations,
            selectedLocation: null,
            spy: null,
            started: false,
          }
        );

        const embed = createGameEmbed(
          "🕵️ Spyfall Game Created",
          `Game created by <@${interaction.user.id}>`
        );

        embed.addFields([
          {
            name: "Players",
            value: formatPlayerList(game.players),
            inline: true,
          },
          {
            name: "Locations",
            value:
              locations.length > 0
                ? `${locations.length} locations loaded`
                : "No locations yet",
            inline: true,
          },
          {
            name: "Status",
            value: "Waiting for players",
            inline: true,
          },
        ]);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("spyfall_join")
            .setLabel("Join Game")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("spyfall_leave")
            .setLabel("Leave Game")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("spyfall_start")
            .setLabel("Start Game")
            .setStyle(ButtonStyle.Success)
            .setDisabled(locations.length === 0),
          new ButtonBuilder()
            .setCustomId("spyfall_reveal")
            .setLabel("I'm the Spy!")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("spyfall_end")
            .setLabel("End Game")
            .setStyle(ButtonStyle.Secondary)
        );

        const message = await interaction.reply({
          embeds: [embed],
          components: [row],
          fetchReply: true,
        });

        // Set up button collector
        const collector = message.createMessageComponentCollector({
          time: 1800000, // 30 minutes
        });

        collector.on("collect", async (buttonInteraction) => {
          await handleSpyfallButton(buttonInteraction, gameManager);
        });

        collector.on("end", () => {
          gameManager.endGame("spyfall", interaction.channelId);
        });

        return;
      }

      if (subcommand === "add") {
        const location = interaction.options.getString("location");
        const game = gameManager.getGame("spyfall", interaction.channelId);

        if (!game) {
          const embed = createErrorEmbed(
            "No Active Game",
            "No Spyfall game is currently active in this channel!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (game.creatorId !== interaction.user.id) {
          const embed = createErrorEmbed(
            "Permission Denied",
            "Only the game creator can add locations!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (game.data.started) {
          const embed = createErrorEmbed(
            "Game Already Started",
            "Cannot add locations to a game in progress!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (game.data.locations.includes(location)) {
          const embed = createErrorEmbed(
            "Duplicate Location",
            "This location is already in the game!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        game.data.locations.push(location);

        const embed = createGameEmbed(
          "📍 Location Added",
          `**${location}** has been added to the game!\n\nTotal locations: ${game.data.locations.length}`
        );

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      await handleError(interaction, error);
    }
  },
};

async function handleSpyfallButton(interaction, gameManager) {
  const game = gameManager.getGame("spyfall", interaction.channelId);

  if (!game) {
    return await interaction.reply({
      content: "This game is no longer active!",
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    switch (interaction.customId) {
      case "spyfall_join":
        if (game.players.has(interaction.user.id)) {
          return await interaction.reply({
            content: "You're already in this game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        gameManager.addPlayer(
          "spyfall",
          interaction.channelId,
          interaction.user.id,
          {
            username: interaction.user.username,
          }
        );

        await interaction.reply({
          content: "You joined the Spyfall game!",
          flags: MessageFlags.Ephemeral,
        });
        break;

      case "spyfall_leave":
        if (!game.players.has(interaction.user.id)) {
          return await interaction.reply({
            content: "You're not in this game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        gameManager.removePlayer(
          "spyfall",
          interaction.channelId,
          interaction.user.id
        );

        await interaction.reply({
          content: "You left the Spyfall game!",
          flags: MessageFlags.Ephemeral,
        });
        break;

      case "spyfall_start":
        if (game.creatorId !== interaction.user.id) {
          return await interaction.reply({
            content: "Only the game creator can start the game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (game.players.size < 3) {
          return await interaction.reply({
            content: "Need at least 3 players to start!",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (game.data.locations.length === 0) {
          return await interaction.reply({
            content: "Need at least one location to start!",
            flags: MessageFlags.Ephemeral,
          });
        }

        // Start the game
        const selectedLocation = getRandomElement(game.data.locations);
        const playerArray = Array.from(game.players.keys());
        const spyId = getRandomElement(playerArray);

        gameManager.updateGameData("spyfall", interaction.channelId, {
          selectedLocation,
          spy: spyId,
          started: true,
        });

        // Send locations to players
        for (const [playerId] of game.players) {
          try {
            const user = await interaction.client.users.fetch(playerId);
            const location =
              playerId === spyId
                ? "🕵️ **You are the SPY!** Try to figure out the location!"
                : `📍 Location: **${selectedLocation}**`;
            await user.send(
              `🎮 **Spyfall Game Started!**\n\n${location}\n\nGood luck!`
            );
          } catch (error) {
            console.error(`Failed to send DM to user ${playerId}:`, error);
          }
        }

        const embed = createGameEmbed(
          "🕵️ Spyfall Game Started!",
          `The game has begun! All players have been sent their roles.\n\n**Players:** ${formatPlayerList(game.players)}\n\n**How to play:** Ask questions about the location to find the spy!`
        );

        await interaction.update({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("spyfall_reveal")
                .setLabel("I'm the Spy!")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("spyfall_end")
                .setLabel("End Game")
                .setStyle(ButtonStyle.Secondary)
            ),
          ],
        });
        break;

      case "spyfall_reveal":
        if (!game.data.started) {
          return await interaction.reply({
            content: "The game hasn't started yet!",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (game.data.spy !== interaction.user.id) {
          return await interaction.reply({
            content: "You're not the spy!",
            flags: MessageFlags.Ephemeral,
          });
        }

        // Spy is revealing themselves - they need to guess the location
        const revealEmbed = createGameEmbed(
          "🕵️ Spy Revealed!",
          `<@${interaction.user.id}> has revealed themselves as the spy!\n\n**Spy, what is the location?**\n\nType your guess in the chat!`
        );

        await interaction.reply({ embeds: [revealEmbed] });
        break;

      case "spyfall_end":
        if (game.creatorId !== interaction.user.id) {
          return await interaction.reply({
            content: "Only the game creator can end the game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        const endEmbed = createGameEmbed(
          "🏁 Game Ended",
          `The Spyfall game has been ended by <@${interaction.user.id}>.\n\n${game.data.selectedLocation ? `**The location was:** ${game.data.selectedLocation}\n**The spy was:** <@${game.data.spy}>` : "Game ended before starting."}`
        );

        gameManager.endGame("spyfall", interaction.channelId);

        await interaction.update({
          embeds: [endEmbed],
          components: [],
        });
        break;
    }
  } catch (error) {
    await handleError(interaction, error);
  }
}
