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
} = require("../../utils/embedUtils");
const { handleError } = require("../../utils/errorHandler");

const gameManager = new GameManager();

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
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("rules").setDescription("Show how to play Who Am I")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "rules") {
        const embed = createGameEmbed(
          "❓ How to Play Who Am I?",
          "A classic identity guessing game!"
        );

        embed.addFields([
          {
            name: "Setup",
            value:
              "• One player starts the game\n• Players join the game\n• Others assign identities to each player\n• Identities can be anything: celebrities, characters, objects, etc.",
            inline: false,
          },
          {
            name: "Gameplay",
            value:
              "• Players can only see other players' identities\n• Ask yes/no questions to figure out your identity\n• Use deduction and the answers to narrow down possibilities\n• First to guess their identity wins!",
            inline: false,
          },
          {
            name: "Tips",
            value:
              "• Start with broad questions (Am I a person? Am I fictional?)\n• Listen to other players' questions and answers\n• Be creative with identities to make it challenging\n• Keep identities appropriate and recognizable",
            inline: false,
          },
        ]);

        return await interaction.reply({ embeds: [embed] });
      }

      if (subcommand === "start") {
        if (gameManager.isGameActive("whoami", interaction.channelId)) {
          const embed = createErrorEmbed(
            "Game Already Active",
            "A Who Am I game is already running in this channel!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const game = gameManager.createGame(
          "whoami",
          interaction.channelId,
          interaction.user.id,
          {
            assignments: new Map(),
            started: false,
          }
        );

        const embed = createGameEmbed(
          "❓ Who Am I? Game Started!",
          `Game started by <@${interaction.user.id}>\n\nPlayers can join and start assigning identities to each other!`
        );

        embed.addFields([
          {
            name: "Players",
            value: formatPlayerList(game.players),
            inline: true,
          },
          {
            name: "Assignments",
            value: "0 assigned",
            inline: true,
          },
        ]);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("whoami_join")
            .setLabel("Join Game")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("whoami_identities")
            .setLabel("Show My Identities")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("whoami_leave")
            .setLabel("Leave Game")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("whoami_end")
            .setLabel("End Game")
            .setStyle(ButtonStyle.Danger)
        );

        const message = await interaction.reply({
          embeds: [embed],
          components: [row],
          fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
          time: 1800000, // 30 minutes
        });

        collector.on("collect", async (buttonInteraction) => {
          await handleWhoAmIButton(buttonInteraction, gameManager);
        });

        collector.on("end", () => {
          gameManager.endGame("whoami", interaction.channelId);
        });

        return;
      }

      if (subcommand === "assign") {
        const targetPlayer = interaction.options.getUser("player");
        const identity = interaction.options.getString("identity");
        const game = gameManager.getGame("whoami", interaction.channelId);

        if (!game) {
          const embed = createErrorEmbed(
            "No Active Game",
            "No Who Am I game is currently active in this channel!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (!game.players.has(targetPlayer.id)) {
          const embed = createErrorEmbed(
            "Player Not in Game",
            "This user is not part of the game!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (targetPlayer.id === interaction.user.id) {
          const embed = createErrorEmbed(
            "Cannot Assign to Self",
            "You cannot assign an identity to yourself!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (!identity.trim()) {
          const embed = createErrorEmbed(
            "Invalid Identity",
            "The identity cannot be empty!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        game.data.assignments.set(targetPlayer.id, {
          identity: identity.trim(),
          assignedBy: interaction.user.id,
          assignedAt: new Date(),
        });

        const embed = createGameEmbed(
          "✅ Identity Assigned!",
          `You have assigned "${identity}" to ${targetPlayer.username}.`
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }
    } catch (error) {
      await handleError(interaction, error);
    }
  },
};

async function handleWhoAmIButton(interaction, gameManager) {
  const game = gameManager.getGame("whoami", interaction.channelId);

  if (!game) {
    return await interaction.reply({
      content: "This game is no longer active!",
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    switch (interaction.customId) {
      case "whoami_join":
        if (game.players.has(interaction.user.id)) {
          return await interaction.reply({
            content: "You're already in this game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        gameManager.addPlayer(
          "whoami",
          interaction.channelId,
          interaction.user.id,
          {
            username: interaction.user.username,
          }
        );

        await interaction.reply({
          content: "You joined the Who Am I game!",
          flags: MessageFlags.Ephemeral,
        });
        break;

      case "whoami_leave":
        if (!game.players.has(interaction.user.id)) {
          return await interaction.reply({
            content: "You're not in this game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        gameManager.removePlayer(
          "whoami",
          interaction.channelId,
          interaction.user.id
        );
        game.data.assignments.delete(interaction.user.id);

        await interaction.reply({
          content: "You left the Who Am I game!",
          flags: MessageFlags.Ephemeral,
        });
        break;

      case "whoami_identities":
        if (!game.players.has(interaction.user.id)) {
          return await interaction.reply({
            content: "You're not in this game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        // Show all OTHER players' identities (not their own)
        const otherIdentities = [];
        for (const [playerId, playerData] of game.players) {
          if (playerId !== interaction.user.id) {
            const assignment = game.data.assignments.get(playerId);
            if (assignment) {
              otherIdentities.push(
                `**${playerData.username}:** ${assignment.identity}`
              );
            } else {
              otherIdentities.push(
                `**${playerData.username}:** *No identity assigned*`
              );
            }
          }
        }

        const embed = createGameEmbed(
          "🔍 Other Players' Identities",
          otherIdentities.length > 0
            ? otherIdentities.join("\n")
            : "No other players or no identities assigned yet!"
        );

        // Show if they have an identity assigned
        const myAssignment = game.data.assignments.get(interaction.user.id);
        if (myAssignment) {
          embed.addFields([
            {
              name: "Your Status",
              value:
                "✅ You have been assigned an identity! Try to guess what it is by asking questions.",
              inline: false,
            },
          ]);
        } else {
          embed.addFields([
            {
              name: "Your Status",
              value:
                "❌ You haven't been assigned an identity yet. Ask other players to assign you one!",
              inline: false,
            },
          ]);
        }

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        break;

      case "whoami_end":
        if (game.creatorId !== interaction.user.id) {
          return await interaction.reply({
            content: "Only the game creator can end the game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        // Show final results
        const finalResults = [];
        for (const [playerId, playerData] of game.players) {
          const assignment = game.data.assignments.get(playerId);
          if (assignment) {
            finalResults.push(
              `**${playerData.username}:** ${assignment.identity}`
            );
          } else {
            finalResults.push(
              `**${playerData.username}:** *No identity assigned*`
            );
          }
        }

        const endEmbed = createGameEmbed(
          "🏁 Who Am I? Game Ended",
          "Here's who everyone was:\n\n" +
            (finalResults.length > 0
              ? finalResults.join("\n")
              : "No identities were assigned!")
        );

        gameManager.endGame("whoami", interaction.channelId);

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
