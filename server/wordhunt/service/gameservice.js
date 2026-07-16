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

    if (!game) {
      return {
        success: false,
        message: "Unable to initialize Word Hunt Repository",
      };
    }

    return {
      success: true,
      message: "Word Hunt Repository Initialized Successfully",
    };
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

    if (!response) {
      return {
        success: false,
        message: "Unable to Insert Stroy Info",
      };
    }

    return {
      success: true,
      message: "Story Info Registered Successfully",
    };
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

    if (!response) {
      return {
        success: false,
        message: "Unable to Write Game Data",
      };
    }

    return {
      success: true,
      message: "Game Data registered successfully",
    };
  } catch (e) {
    throw new Error(e.message);
  }
};

const getPlayerInfoByStory = async (gameId, storyId, playerName) => {
  try {
    if (!gameId) {
      throw new Error("Game Id is Required");
    }

    if (!storyId) {
      throw new Error("Story Id is Required");
    }

    if (!playerName) {
      throw new Error("Player Id is Required");
    }

    const response = await retrievePlayerInfoByStory(gameId, storyId);

    const nounWords = response.nounWords ?? 0;
    const verbWords = response.verbWords ?? 0;
    const adjWords = response.adjWords ?? 0;

    const retrievedGames = response.gameInfo ?? [];

    const playerInfo = retrievedGames.find(
      (player) => player.playerName === playerName,
    );
    // console.log(playerInfo);

    // New player default data
    const playersCoins = playerInfo?.totalCoins ?? 0;
    const playersScore = playerInfo?.totalScore ?? 0;

    const nounData = playerInfo?.games?.Noun?.history ?? [];
    // console.log(nounData);
    const verbData = playerInfo?.games?.Verb?.history ?? [];
    const adjData = playerInfo?.games?.Adjective?.history ?? [];

    const sortedNoun = arraySorter(nounData, nounWords);
    // console.log(sortedNoun);
    const sortedVerb = arraySorter(verbData, verbWords);
    const sortedAdj = arraySorter(adjData, adjWords);

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

const convertTimeToSeconds = (time) => {
  if (!time) {
    return Infinity;
  }

  const [minutes, seconds] = time.split(":").map(Number);

  return minutes * 60 + seconds;
};

const arraySorter = (data = [], wordCount = 0) => {
  // No history
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const lowestTime = [...data].sort(
    (a, b) =>
      convertTimeToSeconds(a.bestTime) - convertTimeToSeconds(b.bestTime),
  )[0];

  if (!lowestTime) {
    return null;
  }

  // Did not complete game
  if ((lowestTime.foundWords ?? 0) < wordCount) {
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
