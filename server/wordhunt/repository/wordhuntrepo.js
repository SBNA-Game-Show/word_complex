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

module.exports = { initializeGame };
