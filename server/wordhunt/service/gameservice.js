const {
  initializeGame,
  getAllGameInfo,
  initializeStoryInfo,
  registerGameData,
  retrievePlayerInfoByStory,
} = require("../repository/wordhuntrepo");

const GameData = require("../models/GameData");
const StoryInfo = require("../models/StoryInfo");

const initWordHuntRepo = async (storyId, gameId) => {
  try {
    if (!Array.isArray(storyId)) {
      throw new Error(
        "Story ID's Must be Passed as an Array. To Initialize Word Hunt DB",
      );
    }

    if (storyId.length === 0) {
      throw new Error("No Story Id is Passed. To Initialize Word Hunt DB");
    }

    if (!gameId) {
      throw new Error("Game Id is required");
    }
    const game = await initializeGame(storyId, gameId);

    return game;
  } catch (e) {
    throw new Error(e.message);
  }
};

const retrieveAllMetaData = async () => {
  try {
    const games = await getAllGameInfo();

    return games;
  } catch (e) {
    throw new Error(e.message);
  }
};

const insertStroyInfo = async (gameId, storyId, storyInfo) => {
  try {
    if (gameId == null) {
      throw new Error("Game Id is Required");
    }
    if (storyId == null) {
      throw new Error("Story Id is Required");
    }
    if (!(storyInfo instanceof StoryInfo)) {
      throw new Error("Incorrect Story Information Passed ");
    }

    const response = initializeStoryInfo(gameId, storyId, storyInfo);

    return response;
  } catch (e) {
    throw new Error(e.message);
  }
};

const insertGameData = async (
  gameId,
  storyId,
  playerId,
  playerName,
  gameData,
  gameInstance,
) => {
  try {
    if (!gameId) {
      throw new Error("Game Id is Required");
    }

    if (!storyId) {
      throw new Error("Story Id is Required");
    }
    if (!playerId) {
      throw new Error("Player Id is Required");
    }

    if (!playerName) {
      throw new Error("Player Name is Required");
    }

    if (!(gameData instanceof GameData)) {
      throw new Error("Invalid Game Data Passed");
    }

    const response = await registerGameData(
      gameId,
      storyId,
      playerId,
      playerName,
      gameData,
      gameInstance,
    );

    return response;
  } catch (e) {
    throw new Error(e.message);
  }
};
const getPlayerInfoByStory = async (gameId, storyId, playerId) => {
  try {
    if (!gameId) {
      throw new Error("Game Id is Required");
    }
    if (!storyId) {
      throw new Error("Story Id is Required");
    }
    if (!playerId) {
      throw new Error("Player Id is Required");
    }

    const response = await retrievePlayerInfoByStory(gameId, storyId, playerId);

    const games = response.games;

    const nounData = games.Noun;

    console.log(nounData);

    return response;
  } catch (e) {
    throw new Error(e.message);
  }
};

module.exports = {
  initWordHuntRepo,
  retrieveAllMetaData,
  insertStroyInfo,
  insertGameData,
  getPlayerInfoByStory,
};
