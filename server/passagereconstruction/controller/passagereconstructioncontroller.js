const { getPassageReconstructionGame } = require("../service/passageReconstructionService");

const STORY_ID = "64980961-31e5-4794-a104-54807f6e96d0";

// Get the passage reconstruction game for a given story id and language
const getGame = async (req, res) => {
  try {
    // Get the game data from the service layer
    const gameData = await getPassageReconstructionGame(
      STORY_ID,
      req.query.language
    );

    // If no game data is found, return a 404 error
    if (!gameData) {
      return res.status(404).json({
        success: false,
        message: "No story available for the given ID",
      });
    }

    // If the game data is found, return a 200 response
    return res.status(200).json({
      success: true,
      data: gameData,
    });
  } catch (error) {
    // If the error is due to an unsupported language, return a 400 error
    const status = error.message.startsWith("Unsupported language") ? 400 : 500;

    // If the error is due to an unsupported language, return a 400 error
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// Export the function
module.exports = { getGame };
