const GameData = require("./GameData");

class Game {
  constructor(gameId, storyId, playerId, playerName, gameInstance, gameData) {
    if (gameId == null) {
      throw new Error("Game Id Cannot be NULL");
    }
    this.gameId = gameId;

    if (storyId == null) {
      throw new Error("Story Id cannot be NULL");
    }
    this.storyId = storyId;

    if (playerId == null) {
      throw new Error("Player Id cannot be NULL");
    }
    this.playerId = playerId;

    if (playerName == null) {
      throw new Error("Player Name Cannot be NULL");
    }
    this.playerName = playerName;

    if (gameInstance == null) {
      throw new Error("Game Instance Cannot be NULL");
    }
    this.gameInstance = gameInstance;

    if (!(gameData instanceof GameData)) {
      throw new Error("Invalid Game Data Passed");
    }

    this.gameData = gameData;
  }
}

module.exports = Game;
