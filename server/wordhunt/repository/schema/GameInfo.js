const mongoose = require("mongoose");
const gameDataSchema = require("./GameData");

const gameInfoSchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      required: true,
    },

    totalCoins: {
      type: Number,
      default: 0,
    },

    totalScore: {
      type: Number,
      default: 0,
    },

    games: [
      {
        Noun: {
          type: gameDataSchema,
        },

        Verb: {
          type: gameDataSchema,
        },

        Adjective: {
          type: gameDataSchema,
        },
      },
    ],
  },
  {
    _id: false,
  },
);

gameInfoSchema.methods.calculateTotals = function () {
  let coins = 0;
  let score = 0;

  this.games.forEach((game) => {
    coins += game.Noun?.coins ?? 0;
    coins += game.Verb?.coins ?? 0;
    coins += game.Adjective?.coins ?? 0;

    score += game.Noun?.totalScore ?? 0;
    score += game.Verb?.totalScore ?? 0;
    score += game.Adjective?.totalScore ?? 0;
  });

  this.totalCoins = coins;
  this.totalScore = score;
};

module.exports = gameInfoSchema;
