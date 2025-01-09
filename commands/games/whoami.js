const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

let gameStarted = false;
let gameStarterId = null;
let players = [];
let assignments = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whoami")
    .setDescription("Play the 'Who Am I?' game!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Starts a new game and allows players to join.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("assign")
        .setDescription("Assign an identity to a player.")
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("The player you want to assign an identity to.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("identity")
            .setDescription("The identity you want to assign.")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "start") {
      if (gameStarted) {
        await interaction.reply({
          content: "A game is already in progress!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      players = [];
      assignments = {};
      gameStarted = true;
      gameStarterId = interaction.user.id;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("join_game")
          .setLabel("Join the Game")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("show_identities")
          .setLabel("Show Player Identities")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("cancel_game")
          .setLabel("Cancel Game")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(interaction.user.id !== gameStarterId),
        new ButtonBuilder()
          .setCustomId("end_game")
          .setLabel("End Game")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(interaction.user.id !== gameStarterId)
      );

      await interaction.reply({
        content: "Welcome to 'Who Am I?'! Choose an action:",
        components: [row],
      });

      const filter = (i) =>
        ["join_game", "show_identities", "cancel_game", "end_game"].includes(
          i.customId
        );
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "join_game") {
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
        } else if (i.customId === "show_identities") {
          if (Object.keys(assignments).length < players.length) {
            await i.reply({
              content: "Not all players have been assigned an identity yet!",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const otherPlayersWithIdentities = players
            .filter((p) => p.id !== i.user.id)
            .map((p) => {
              const identity = assignments[p.id];
              return `<@${p.id}>: ${identity}`;
            })
            .join("\n");

          if (otherPlayersWithIdentities.length === 0) {
            await i.reply({
              content: "No other players have been assigned an identity yet!",
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await i.reply({
              content: otherPlayersWithIdentities,
              flags: MessageFlags.Ephemeral,
            });
          }
        } else if (i.customId === "cancel_game") {
          if (i.user.id !== gameStarterId) {
            await i.reply({
              content:
                "You are not the game starter. You cannot cancel the game.",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          collector.stop();

          await i.reply("Game has been cancelled!");

          gameStarted = false;
          players = [];
          assignments = {};
        } else if (i.customId === "end_game") {
          if (i.user.id !== gameStarterId) {
            await i.reply({
              content: "You are not the game starter. You cannot end the game.",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          collector.stop();

          let message = "The game has ended! Here's who everyone is:\n";
          for (const player of players) {
            const identity = assignments[player.id] || "Unknown";
            message += `<@${player.id}>: ${identity}\n`;
          }
          await i.reply(message);

          gameStarted = false;
          players = [];
          assignments = {};
        }
      });
    } else if (subcommand === "assign") {
      if (!gameStarted) {
        await interaction.reply({
          content:
            "No game is currently in progress. Start one with `/whoami start`.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const player = interaction.options.getUser("player");
      const identity = interaction.options.getString("identity");

      if (!players.some((p) => p.id === player.id)) {
        await interaction.reply({
          content: "This user is not part of the game!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (player.id === interaction.user.id) {
        await interaction.reply({
          content: "You cannot assign an identity to yourself!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (!identity.trim()) {
        await interaction.reply({
          content: "The identity cannot be empty or just spaces.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      assignments[player.id] = identity;
      await interaction.reply({
        content: `You have assigned "${identity}" to ${player.username}.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
