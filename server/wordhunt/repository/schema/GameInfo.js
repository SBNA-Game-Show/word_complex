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

    game: {
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
  },
  { _id: false },
);

gameInfoSchema.methods.calculateTotals = function () {
  const game = this.game || {};

  this.totalCoins =
    (game.Noun?.coins ?? 0) +
    (game.Verb?.coins ?? 0) +
    (game.Adjective?.coins ?? 0);

  this.totalScore =
    (game.Noun?.totalScore ?? 0) +
    (game.Verb?.totalScore ?? 0) +
    (game.Adjective?.totalScore ?? 0);
};
module.exports = gameInfoSchema;
