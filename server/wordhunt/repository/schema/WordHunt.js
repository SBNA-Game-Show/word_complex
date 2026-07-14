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
      nounWords: {
        type: Number,
        default: 0,
      },
      nounHints: {
        type: Number,
        default: 0,
      },
      verbWords: {
        type: Number,
        default: 0,
      },
      verbHints: {
        type: Number,
        default: 0,
      },
      adjWords: {
        type: Number,
        default: 0,
      },
      adjHints: {
        type: Number,
        default: 0,
      },

      gameInfo: [gameInfoSchema],
    },
  ],
});

wordHuntSchema.methods.initializeStoryInfo = function (story, storyInfo) {
  story.nounWords = storyInfo.nounGameWords;
  story.nounHints = storyInfo.nounGameHints;

  story.verbWords = storyInfo.verbGameWords;
  story.verbHints = storyInfo.verbGameHints;

  story.adjWords = storyInfo.adjGameWords;
  story.adjHints = storyInfo.adjGameHints;
};

wordHuntSchema.methods.saveNounGame = function (gameData) {
  this.addNounGame(gameData);
};

module.exports = mongoose.model("WordHunt_GameData", wordHuntSchema);
