const mongoose = require("mongoose");
const gameDataSchema = require("./GameData");

const gameInfoSchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      default: null,
    },

    totalCoins: {
      type: Number,
      default: 0,
    },

    totalScore: {
      type: Number,
      default: 0,
    },

    games: {
      Noun: {
        history: {
          type: [gameDataSchema],
          default: [],
        },
      },

      Verb: {
        history: {
          type: [gameDataSchema],
          default: [],
        },
      },

      Adjective: {
        history: {
          type: [gameDataSchema],
          default: [],
        },
      },
    },
  },
  {
    _id: false,
  },
);

gameInfoSchema.methods.addNounGame = function (gameData) {
  if (!this.games.Noun) {
    throw new Error("Noun game is not Initialized");
  }
  this.games.Noun.history.push(gameData);

  this.calculateTotals();
};
gameInfoSchema.methods.addVerbGame = function (gameData) {
  if (!this.games.Verb) {
    throw new Error("Noun game is not Initialized");
  }
  this.games.Verb.history.push(gameData);

  this.calculateTotals();
};
gameInfoSchema.methods.addAdjGame = function (gameData) {
  if (!this.games.Adjective) {
    throw new Error("Noun game is not Initialized");
  }
  this.games.Adjective.history.push(gameData);

  this.calculateTotals();
};

gameInfoSchema.methods.calculateTotals = function () {
  let coins = 0;
  let score = 0;

  Object.values(this.games).forEach((game) => {
    if (!game) return;

    game.history.forEach((instance) => {
      coins += instance.coins ?? 0;
      score += instance.totalScore ?? 0;
    });
  });

  this.totalCoins = coins;
  this.totalScore = score;
};

module.exports = gameInfoSchema;
