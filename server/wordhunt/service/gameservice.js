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

    const nounWords = response.nounWords;
    const verbWords = response.verbWords;
    const adjWords = response.adjWords;

    const retrievedGames = response.gameInfo;

    const playerInfo = retrievedGames.find((player) => player._id === playerId);
    const playersCoins = playerInfo.totalCoins;
    const playersScore = playerInfo.totalScore;
    // console.log("Player Info: ", playerInfo);

    const nounData = playerInfo.games.Noun.history;
    // console.log(nounData);
    const verbData = playerInfo.games.Verb.history;
    const adjData = playerInfo.games.Adjective.history;

    const sortedNoun = arraySorter(nounData, nounWords);
    const sortedVerb = arraySorter(verbData, verbWords);
    const sortedAdj = arraySorter(adjData, adjWords);

    // return response;

    return {
      storyId: storyId,
      earnedCoins: playersCoins,
      earnedScore: playersScore,
      games: {
        Noun: sortedNoun,
        Verb: sortedVerb,
        Adjective: sortedAdj,
      },
    };
  } catch (e) {
    throw new Error(e.message);
  }
};

const arraySorter = (data, wordCount) => {
  const lowestTime = data.sort((a, b) => a.bestTime - b.bestTime)[0];

  if (lowestTime.foundWords < wordCount) {
    return null;
  }

  return lowestTime;
};

module.exports = {
  initWordHuntRepo,
  retrieveAllMetaData,
  insertStroyInfo,
  insertGameData,
  getPlayerInfoByStory,
};
