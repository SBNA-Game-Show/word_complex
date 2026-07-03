const { getPassageReconstructionGame } = require("../service/passageReconstructionService");

const getGame = async (req, res) => {
  try {
    // Story is chosen per-player on the client and must be sent with each
    // request. A missing storyId means a broken client/server contract — fail
    // loudly rather than silently serving a default story.
    const { storyId } = req.query;

    if (!storyId) {
      return res.status(400).json({
        success: false,
        message: "storyId is required",
      });
    }

    const gameData = await getPassageReconstructionGame(storyId);

    if (!gameData) {
      return res.status(404).json({
        success: false,
        message: "No story available for the given ID",
      });
    }

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

module.exports = { getGame };
