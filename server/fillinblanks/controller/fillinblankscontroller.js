const retrieveStoryById = require("../../raw-data-connect/retrieveTokenizedStoryById");
const { getAnswers, getNumberOfBlanks, createFillInBlankGame, getDistractors } = require("../services/fillinblankservice");


async function initializeGame(req, res) {
  try {
    const storyId = "292f2009-96bb-4a3c-b856-e04214e852f8";

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
      numberOfBlanks
    );

    const gameData = createFillInBlankGame(
      story._id,
      story[versionField],
      answers,
      distractors
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