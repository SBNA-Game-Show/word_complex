const { initializeGame } = require("../repository/wordhuntrepo");

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

module.exports = { initWordHuntRepo };
