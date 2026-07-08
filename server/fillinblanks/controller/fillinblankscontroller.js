const {
  retrieveStoryById,
} = require("../../raw-data-connect/retrieveTokenizedStoryById");
const {
  getAnswers,
  getNumberOfBlanks,
  createFillInBlankGame,
  getDistractors,
} = require("../services/fillinblankservice");

async function initializeGame(req, res) {
  try {
    // Story is chosen per-player on the client and must be sent with each
    // request. A missing storyId means a broken client/server contract — fail
    // loudly rather than silently serving a default story.
    const { storyId } = req.query;

    if (!storyId) {
      return res.status(400).json({
        success: false,
        message: "storyId is required",
      });
    }

    const story = await retrieveStoryById(storyId);

    const language = req.query.language || "english";
    const versionField = `${language}Version`;
    const tokenizedField = `tokenized_${language}_version`;
    const words = story[tokenizedField];

    const difficulty = req.query.difficulty || "easy";
    const wordTypes = req.query.wordTypes
      ? req.query.wordTypes.split(",")
      : ["NOUN"];

    const numberOfBlanks = getNumberOfBlanks(difficulty);
    const answers = getAnswers(words, wordTypes, numberOfBlanks);

    const distractors = getDistractors(
      words,
      answers,
      wordTypes,
      numberOfBlanks,
    );

    const gameData = createFillInBlankGame(
      story._id,
      story[versionField],
      answers,
      distractors,
    );

    return res.status(200).json({
      success: true,
      data: gameData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = { initializeGame };
