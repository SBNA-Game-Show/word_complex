const WordHunt = require("./schema/WordHunt");

const MAXIMUM_STORIES_TO_HAVE_IN_A_GAME = 4;

/**
 *
 * @param {["storyId1","storyId2","storyId3","storyId4"]} storyId
 * Takes a array fo story Ids as paramater
 * @param {gameId1} gameId
 * Takes game Id
 * Initializes Word Hunt Game Repository
 *
 * @returns
 */
const initializeGame = async (storyId, gameId) => {
  if (!Array.isArray(storyId)) {
    throw new Error(
      "Story ID's Must be Passed as an Array. To Initialize Word Hunt DB",
    );
  }

  if (storyId.length === 0) {
    throw new Error("No Story Id is Passed. To Initialize Word Hunt DB");
  }

  if (storyId.length > MAXIMUM_STORIES_TO_HAVE_IN_A_GAME) {
    throw new Error(
      `Maximum Limit of Stories in a Game is ${MAXIMUM_STORIES_TO_HAVE_IN_A_GAME}. Instead ${storyId.length} were Provided. To Initialize Word Hunt DB`,
    );
  }

  if (!gameId) {
    throw new Error("Game Id is required. To Initialize Word Hunt DB");
  }

  const stories = storyId.map((id) => ({
    storyId: id,
    gameInfo: [],
  }));

  const game = new WordHunt({
    _id: gameId,
    stories,
  });

  return await game.save();
};
/**
 *
 * @returns the complete Word Hunt Repository for Leaderboard and other game
 * data purposes
 */
const getAllGameInfo = async () => {
  const games = await WordHunt.find();

  return games;
};
/**
 * According to given game id, story id and data like number of words to find in the story.
 * writes data according to the game
 */

const initializeStoryInfo = async (gameId, storyId, storyInfo) => {
  try {
    const game = await WordHunt.findById(gameId);

    if (!game) {
      throw new Error("No Game Found By Given Id");
    }

    const story = game.stories.find((story) => story.storyId === storyId);

    if (!story) {
      throw new Error("No Story Found By Given Id");
    }

    const response = game.initializeStoryInfo(story, storyInfo);

    await game.save();

    return response;
  } catch (e) {
    throw new Error(e.message);
  }
};
/**
 * Given gameid, story id , playername ana and data game metadata
 * wirites to the noun game if player name is found then adds to the same player
 * data else creates a new player data
 */

const registerGameData = async (
  gameId,
  storyId,
  playerId,
  playerName,
  gameData,
  gameInstance,
) => {
  try {
    if (!["Noun", "Verb", "Adjective"].includes(gameInstance)) {
      throw new Error("Invalid Game Instance");
    }

    const game = await WordHunt.findById(gameId);

    if (!game) {
      throw new Error("No Game Can be Found By Given Game Id");
    }

    const story = game.stories.find((story) => story.storyId === storyId);

    if (!story) {
      throw new Error("No Story can be Found By Given Story Id");
    }

    let player = story.gameInfo.find(
      (player) => player.playerName === playerName,
    );

    // Create player if not found
    if (!player) {
      story.gameInfo.push({
        _id: playerId,
        playerName,
        totalCoins: 0,
        totalScore: 0,
        games: {
          Noun: {
            history: [],
          },
          Verb: {
            history: [],
          },
          Adjective: {
            history: [],
          },
        },
      });

      player = story.gameInfo[story.gameInfo.length - 1];
    }

    // Ensure all game histories exist (for older documents)
    player.games ??= {};

    player.games.Noun ??= { history: [] };
    player.games.Verb ??= { history: [] };
    player.games.Adjective ??= { history: [] };

    switch (gameInstance) {
      case "Noun":
        player.addNounGame(gameData);
        break;

      case "Verb":
        player.addVerbGame(gameData);
        break;

      case "Adjective":
        player.addAdjGame(gameData);
        break;
    }

    await game.save();

    return player;
  } catch (e) {
    throw new Error(e.message);
  }
};

const retrievePlayerInfoByStory = async (gameId, storyId, playerId) => {
  if (!gameId) {
    throw new Error("Game Id is required");
  }

  if (!storyId) {
    throw new Error("Story Id is Required");
  }

  if (!playerId) {
    throw new Error("Player Id is Required");
  }

  const game = await WordHunt.findById(gameId);

  if (!game) {
    throw new Error("No Game Found By Given Id");
  }

  const story = game.stories.find((story) => story.storyId === storyId);

  if (!story) {
    throw new Error("No Story Found By Given Id");
  }

  const player = story.gameInfo.find((player) => player._id === playerId);

  if (!player) {
    throw new Error("No Player Found By Given Name");
  }

  return player;
};

module.exports = {
  initializeGame,
  getAllGameInfo,
  initializeStoryInfo,
  registerGameData,
  retrievePlayerInfoByStory,
};
