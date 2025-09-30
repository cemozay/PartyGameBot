class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(gameType, channelId, creatorId, options = {}) {
    const gameId = `${gameType}_${channelId}`;

    if (this.games.has(gameId)) {
      throw new Error(`A ${gameType} game is already active in this channel!`);
    }

    const game = {
      id: gameId,
      type: gameType,
      channelId,
      creatorId,
      createdAt: new Date(),
      status: "waiting", // waiting, active, ended
      players: new Map(),
      data: { ...options },
    };

    this.games.set(gameId, game);
    return game;
  }

  getGame(gameType, channelId) {
    const gameId = `${gameType}_${channelId}`;
    return this.games.get(gameId);
  }

  endGame(gameType, channelId) {
    const gameId = `${gameType}_${channelId}`;
    const game = this.games.get(gameId);
    if (game) {
      game.status = "ended";
      this.games.delete(gameId);
    }
    return game;
  }

  addPlayer(gameType, channelId, playerId, playerData = {}) {
    const game = this.getGame(gameType, channelId);
    if (!game) {
      throw new Error("No active game found!");
    }

    game.players.set(playerId, {
      id: playerId,
      joinedAt: new Date(),
      ...playerData,
    });

    return game;
  }

  removePlayer(gameType, channelId, playerId) {
    const game = this.getGame(gameType, channelId);
    if (game) {
      game.players.delete(playerId);
    }
    return game;
  }

  updateGameData(gameType, channelId, data) {
    const game = this.getGame(gameType, channelId);
    if (game) {
      game.data = { ...game.data, ...data };
    }
    return game;
  }

  isGameActive(gameType, channelId) {
    const game = this.getGame(gameType, channelId);
    return game && game.status !== "ended";
  }

  getPlayerCount(gameType, channelId) {
    const game = this.getGame(gameType, channelId);
    return game ? game.players.size : 0;
  }
}

module.exports = { GameManager };
