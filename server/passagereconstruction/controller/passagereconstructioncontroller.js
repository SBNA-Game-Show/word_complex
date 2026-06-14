const { getPassageReconstructionGame } = require("../service/passageReconstructionService");

const STORY_ID = "292f2009-96bb-4a3c-b856-e04214e852f8";

const getGame = async (req, res) => {
  try {
    const gameData = await getPassageReconstructionGame(STORY_ID);

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
