const GameData = require("../models/GameData");
const Game = require("../models/GameDTO");
const StoryInfo = require("../models/StoryInfo");
const {
  initWordHuntRepo,
  retrieveAllMetaData,
  insertStroyInfo,
  insertGameData,
} = require("../service/gameservice");

const initGame = async (req, res) => {
  try {
    const { storyId, gameId } = req.body;

    const game = await initWordHuntRepo(storyId, gameId);

    return res.status(201).json({
      success: true,
      data: game,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAll = async (req, res) => {
  try {
    const gameData = await retrieveAllMetaData();

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
};

const addStoryInfo = async (req, res) => {
  try {
    const {
      gameId,
      storyId,
      nounGameWords,
      nounGameHints,
      verbGameWords,
      verbGameHints,
      adjGameWords,
      adjGameHints,
    } = req.body;

    const storyInfo = new StoryInfo(
      nounGameWords,
      nounGameHints,
      verbGameWords,
      verbGameHints,
      adjGameWords,
      adjGameHints,
    );

    const response = await insertStroyInfo(gameId, storyId, storyInfo);

    return res.status(200).json({
      success: true,
      message: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addGameData = async (req, res) => {
  try {
    const {
      gameId,
      storyId,
      playerId,
      playerName,
      bestTime,
      coins,
      totalScore,
      hintsUsed,
      foundWords,
      gameInstance,
    } = req.body;

    const gameData = new GameData(
      bestTime,
      coins,
      totalScore,
      hintsUsed,
      foundWords,
    );

    const response = await insertGameData(
      gameId,
      storyId,
      playerId,
      playerName,
      gameData,
      gameInstance,
    );

    return res.status(200).json({
      success: true,
      message: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { initGame, getAll, addStoryInfo, addGameData };
