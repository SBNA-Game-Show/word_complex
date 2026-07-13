const mongoose = require("mongoose");
const gameInfoSchema = require("./GameInfo");

const wordHuntSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: [true, "Unique Id is required"],
  },

  stories: [
    {
      storyId: {
        type: String,
        required: [true, "Story Id is required"],
      },

      gameInfo: [gameInfoSchema],
    },
  ],
});

module.exports = mongoose.model("WordHunt", wordHuntSchema);
