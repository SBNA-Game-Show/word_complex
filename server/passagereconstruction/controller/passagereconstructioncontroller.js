const { getPassageReconstructionGame } = require("../service/passageReconstructionService");

// Get the passage reconstruction game for the player's chosen story + language
const getGame = async (req, res) => {
  try {
    // Story is chosen per-player on the client and must be sent with each
    // request. A missing storyId means a broken client/server contract — fail
    // loudly rather than silently serving a default story. (No hardcoded
    // fallback IDs — decided 2026-07-02.)
    const { storyId, language } = req.query;

    if (!storyId) {
      return res.status(400).json({
        success: false,
        message: "storyId is required",
      });
    }

    const gameData = await getPassageReconstructionGame(storyId, language);

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
