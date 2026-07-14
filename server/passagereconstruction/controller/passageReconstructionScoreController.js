/**
 * passageReconstructionScoreController.js
 * --------------------------------------------------------------------------
 * HTTP layer for Passage Reconstruction scores.
 *   POST /passagereconstruction/score        -> submitScore
 *   GET  /passagereconstruction/leaderboard  -> getLeaderboard (?limit=x)
 * Mirrors the Context Cloze Quest controller so the games stay consistent.
 * --------------------------------------------------------------------------
 */

const {
  saveBestRun,
  getTopPlayers,
} = require("../service/passageReconstructionScoreService");

async function submitScore(req, res) {
  try {
    const { uuid, displayName, score, time, hintsUsed, storyId } = req.body;

    const result = await saveBestRun({
      uuid,
      displayName,
      score: Number(score),
      time: Number(time),
      hintsUsed: Number(hintsUsed),
      storyId,
    });

    return res.status(200).json({
      success: true,
      updated: result.updated,
      message: result.updated
        ? "Best run saved"
        : "Existing best run was kept",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getLeaderboard(req, res) {
  try {
    const limit = req.query.limit || 10;
    const players = await getTopPlayers(limit);

    const leaderboard = players.map((player, index) => ({
      rank: index + 1,
      uuid: player._id,
      displayName: player.displayName,
      score: player.bestScore,
      bestTime: player.bestTime,
      hintsUsed: player.hintsUsed,
      storyId: player.storyId,
    }));

    return res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = { submitScore, getLeaderboard };
