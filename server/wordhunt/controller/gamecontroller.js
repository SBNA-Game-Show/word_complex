const GameData = require("../models/GameData");
const Game = require("../models/GameDTO");
const StoryInfo = require("../models/StoryInfo");
const {
  initWordHuntRepo,
  retrieveAllMetaData,
  insertStroyInfo,
  insertGameData,
  getPlayerInfoByStory,
} = require("../service/gameservice");

/**
 * Initializes  Word Hunt repository where passage information
 * and game meta data are stored
 * This end point was created for testing currently
 * the collection is directly created when a new story set is created
 * currently the max limit is set to 4
 * @param {[storyId's],gameId} req
 * @param {*} res
 * @returns
 */
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
/**
 * Retrieves All game data from the collection for leaderboard purposes
 * This end point was created for testing currently this end point is cunsumed
 * by leaderboard services
 *
 * @param {*} req
 * @param {*} res
 * @returns
 */

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
/**
 * Given Params in the request body adds the passage informtion like 
 * nounGameWords,nounGameHints,verbGameWords,verbGameHints,adjGameWords,
      adjGameHints to the word hunt collection 
 * Client side is currently controlling to write only Sanskrit version of the 
      passage   
 * @param {      
 * gameId,
      storyId,
      nounGameWords,
      nounGameHints,
      verbGameWords,
      verbGameHints,
      adjGameWords,
      adjGameHints,} req 
 * @param {success, message} res 
 * @returns success and a message
 */

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
/**
 * Given the required game meta data from the particular passage
 * this emd point stores all the information individually into the collection
 * according to story set, story and player
 * @param {      
 *    gameId,
      storyId,
      playerId,
      playerName,
      bestTime,
      coins,
      totalScore,
      hintsUsed,
      foundWords,
      gameInstance,} req 
 * @param {success: true/false, message} res 
 * @returns 
 */

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
/**
 * Given params the end point fetches the player information
 * form the collection parses it 
 * CONDITIONS
 * IF THE PLAYER HAS COMPLETED THE GAME THEN THE COMPLETION TIME IS SENT
 * WHICH IS THEN USED AS THE BASE TIME FOR THE STORY FOR THE PLAYER
 * @param {gameId,storyId,playerName} req 
 * @param {Player information on story} res 
 * @returns 
 */

const fetchPlayerData = async (req, res) => {
  try {
    const { gameId, storyId, playerName } = req.query;

    const response = await getPlayerInfoByStory(gameId, storyId, playerName);

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

module.exports = {
  initGame,
  getAll,
  addStoryInfo,
  addGameData,
  fetchPlayerData,
};
