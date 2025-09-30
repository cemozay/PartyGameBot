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

const truthQuestions = [
  "What's the most embarrassing thing that's ever happened to you?",
  "What's your biggest fear?",
  "What's the last lie you told?",
  "Who was your first crush?",
  "What's your most unusual talent?",
  "What's the worst advice you've ever given?",
  "What's your guilty pleasure?",
  "If you could change one thing about yourself, what would it be?",
  "What's the most childish thing you still do?",
  "What's your biggest regret?",
];

const dareActions = [
  "Do 10 push-ups",
  "Sing the chorus of your favorite song",
  "Do an impression of someone in the group",
  "Tell a joke",
  "Dance for 30 seconds",
  "Speak in an accent for the next 3 minutes",
  "Do your best animal impression",
  "Share an embarrassing photo from your phone",
  "Let someone else post a status on your social media",
  "Call a random contact and sing them a song",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("truthordare")
    .setDescription("Play Truth or Dare!")
    .addSubcommand((subcommand) =>
      subcommand.setName("start").setDescription("Start a Truth or Dare game")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("spin").setDescription("Spin for Truth or Dare")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a custom truth or dare")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Truth or Dare")
            .setRequired(true)
            .addChoices(
              { name: "Truth", value: "truth" },
              { name: "Dare", value: "dare" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("content")
            .setDescription("The truth question or dare action")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rules")
        .setDescription("Show how to play Truth or Dare")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "rules") {
        const embed = createGameEmbed(
          "🎯 How to Play Truth or Dare",
          "Truth or Dare is a classic party game!"
        );

        embed.addFields([
          {
            name: "Setup",
            value:
              "• One player starts the game\n• Players join by clicking the join button\n• Anyone can spin for a truth or dare",
            inline: false,
          },
          {
            name: "Gameplay",
            value:
              "• Click 'Spin!' to get a random truth question or dare\n• Complete your truth or dare honestly\n• Take turns or let anyone spin anytime",
            inline: false,
          },
          {
            name: "Custom Content",
            value:
              "• Add your own truth questions and dares\n• Make the game more personal and fun\n• Keep it appropriate and fun for everyone",
            inline: false,
          },
        ]);

        return await interaction.reply({ embeds: [embed] });
      }

      if (subcommand === "start") {
        if (gameManager.isGameActive("truthordare", interaction.channelId)) {
          const embed = createErrorEmbed(
            "Game Already Active",
            "A Truth or Dare game is already running in this channel!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const game = gameManager.createGame(
          "truthordare",
          interaction.channelId,
          interaction.user.id,
          {
            customTruths: [],
            customDares: [],
            spinsCount: 0,
          }
        );

        const embed = createGameEmbed(
          "🎯 Truth or Dare Game Started",
          `Game started by <@${interaction.user.id}>\n\nJoin the game and start spinning!`
        );

        embed.addFields([
          {
            name: "Players",
            value: formatPlayerList(game.players),
            inline: true,
          },
          {
            name: "Total Spins",
            value: "0",
            inline: true,
          },
        ]);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("tod_join")
            .setLabel("Join Game")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("tod_spin")
            .setLabel("🎰 Spin!")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("tod_leave")
            .setLabel("Leave Game")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("tod_end")
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
          await handleTruthOrDareButton(buttonInteraction, gameManager);
        });

        collector.on("end", () => {
          gameManager.endGame("truthordare", interaction.channelId);
        });

        return;
      }

      if (subcommand === "spin") {
        const game = gameManager.getGame("truthordare", interaction.channelId);

        if (!game) {
          const embed = createErrorEmbed(
            "No Active Game",
            "No Truth or Dare game is currently active in this channel! Use `/truthordare start` to begin."
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        await performSpin(interaction, game, gameManager);
        return;
      }

      if (subcommand === "add") {
        const type = interaction.options.getString("type");
        const content = interaction.options.getString("content");
        const game = gameManager.getGame("truthordare", interaction.channelId);

        if (!game) {
          const embed = createErrorEmbed(
            "No Active Game",
            "No Truth or Dare game is currently active in this channel!"
          );
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (type === "truth") {
          game.data.customTruths.push(content);
        } else {
          game.data.customDares.push(content);
        }

        const embed = createGameEmbed(
          "✅ Added!",
          `Your custom ${type} has been added to the game!`
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }
    } catch (error) {
      await handleError(interaction, error);
    }
  },
};

async function handleTruthOrDareButton(interaction, gameManager) {
  const game = gameManager.getGame("truthordare", interaction.channelId);

  if (!game) {
    return await interaction.reply({
      content: "This game is no longer active!",
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    switch (interaction.customId) {
      case "tod_join":
        if (game.players.has(interaction.user.id)) {
          return await interaction.reply({
            content: "You're already in this game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        gameManager.addPlayer(
          "truthordare",
          interaction.channelId,
          interaction.user.id,
          {
            username: interaction.user.username,
          }
        );

        await interaction.reply({
          content: "You joined the Truth or Dare game!",
          flags: MessageFlags.Ephemeral,
        });
        break;

      case "tod_leave":
        if (!game.players.has(interaction.user.id)) {
          return await interaction.reply({
            content: "You're not in this game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        gameManager.removePlayer(
          "truthordare",
          interaction.channelId,
          interaction.user.id
        );

        await interaction.reply({
          content: "You left the Truth or Dare game!",
          flags: MessageFlags.Ephemeral,
        });
        break;

      case "tod_spin":
        await performSpin(interaction, game, gameManager);
        break;

      case "tod_end":
        if (game.creatorId !== interaction.user.id) {
          return await interaction.reply({
            content: "Only the game creator can end the game!",
            flags: MessageFlags.Ephemeral,
          });
        }

        const endEmbed = createGameEmbed(
          "🏁 Game Ended",
          `The Truth or Dare game has been ended by <@${interaction.user.id}>.\n\nTotal spins: ${game.data.spinsCount}`
        );

        gameManager.endGame("truthordare", interaction.channelId);

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

async function performSpin(interaction, game, gameManager) {
  const isToD = Math.random() < 0.5;
  let content;

  if (isToD) {
    const allTruths = [...truthQuestions, ...game.data.customTruths];
    content = getRandomElement(allTruths);
  } else {
    const allDares = [...dareActions, ...game.data.customDares];
    content = getRandomElement(allDares);
  }

  game.data.spinsCount++;

  const embed = createGameEmbed(
    `🎯 ${isToD ? "TRUTH" : "DARE"} for ${interaction.user.username}!`,
    `**${content}**`,
    isToD ? 0x3498db : 0xe74c3c
  );

  embed.addFields([
    {
      name: "Spinner",
      value: `<@${interaction.user.id}>`,
      inline: true,
    },
    {
      name: "Total Spins",
      value: game.data.spinsCount.toString(),
      inline: true,
    },
  ]);

  await interaction.reply({ embeds: [embed] });
}
