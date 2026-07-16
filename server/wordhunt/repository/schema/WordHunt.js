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

wordHuntSchema.methods.isStoryInitialized = function (story) {
  return (
    story.nounWords !== 0 ||
    story.nounHints !== 0 ||
    story.verbWords !== 0 ||
    story.verbHints !== 0 ||
    story.adjWords !== 0 ||
    story.adjHints !== 0
  );
};

wordHuntSchema.methods.storyInfoMatchers = function (story, storyInfo) {
  return (
    story.nounWords === storyInfo.nounGameWords &&
    story.nounHints === storyInfo.nounGameHints &&
    story.verbWords === storyInfo.verbGameWords &&
    story.verbHints === storyInfo.verbGameHints &&
    story.adjWords === storyInfo.adjGameWords &&
    story.adjHints === storyInfo.adjGameHints
  );
};

module.exports = mongoose.model("WordHunt_GameData", wordHuntSchema);
