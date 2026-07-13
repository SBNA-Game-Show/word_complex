const mongoose = require("mongoose");

const gameDataSchema = new mongoose.Schema(
  {
    bestTime: {
      type: String,
      required: true,
    },

    coins: {
      type: Number,
      default: 0,
    },

    totalScore: {
      type: Number,
      default: 0,
    },

    hintsUsed: {
      type: Number,
      default: 0,
    },

    foundWords: {
      type: Number,
      default: 0,
    },

    achievedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

module.exports = gameDataSchema;
