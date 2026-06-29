/**
 * leaderboardController.js
 * --------------------------------------------------------------------------
 * HTTP handlers for the read side of the leaderboard. The write path is an
 * in-process function call from Anthony's score check, so it has no route here.
 *
 *   GET /api/v1/leaderboard?game=master&limit=100   -> top players for a board
 *   GET /api/v1/leaderboard/rank?uuid=...&game=...   -> one player's rank
 * --------------------------------------------------------------------------
 */

const {
  getLeaderboard,
  getPlayerRank,
} = require("../service/leaderboardReadService");

const getLeaderboardController = async (req, res) => {
  try {
    const { game, limit } = req.query;
    const data = await getLeaderboard({ game, limit });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    // Unknown board name etc. is a client error; anything else is a 500.
    const status = /^Unknown board/.test(error.message) ? 400 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

const getPlayerRankController = async (req, res) => {
  try {
    const { uuid, game } = req.query;
    if (!uuid) {
      return res
        .status(400)
        .json({ success: false, message: "uuid query parameter is required" });
    }

    const data = await getPlayerRank({ uuid, game });
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Player has no leaderboard record yet" });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    const status = /^Unknown board/.test(error.message) ? 400 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { getLeaderboardController, getPlayerRankController };
