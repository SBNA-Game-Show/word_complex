const WordHunt = require("./schema/WordHunt");

const MAXIMUM_STORIES_TO_HAVE_IN_A_GAME = 4;

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
    gameInfo: [
      {
        totalCoins: 0,
        totalScore: 0,
      },
    ],
  }));

  const game = new WordHunt({
    _id: gameId,
    stories,
  });

  return await game.save();
};

const getAllGameInfo = async () => {
  const games = await WordHunt.find();

  if (!games || games.length === 0) {
    return [];
  }

  return games;
};

const retrievePlayerInfoByStory = async (gameId, storyId, playerName) => {
  if (!gameId) {
    throw new Error("Game Id is required");
  }

  if (!storyId) {
    throw new Error("Story Id is Required");
  }

  if (!playerName) {
    throw new Error("Player Name is Required");
  }

  const game = await WordHunt.findById(gameId);

  if (!game) {
    throw new Error("No Game Found By Given Id");
  }

  const story = game.stories.find((story) => story.storyId === storyId);

  if (!story) {
    throw new Error("No Story Found By Given Id");
  }

  const player = story.gameInfo.find(
    (player) => player.playerName === playerName,
  );

  if (!player) {
    throw new Error("No Player Found By Given Name");
  }

  return player;
};


module.exports = { initializeGame, getAllGameInfo };
