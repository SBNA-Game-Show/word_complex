const {
  saveBestScore,
  getTopPlayers,
} = require("../services/contextClozeQuestScoreService");

async function submitScore(req, res) {
  try {
    const {
      uuid,
      displayName,
      score,
      bestTime,
      storyId,
      difficulty,
    } = req.body;

    const result = await saveBestScore({
      uuid,
      displayName,
      score,
      bestTime,
      storyId,
      difficulty,
    });

    return res.status(200).json({
      success: true,
      updated: result.updated,
      message: result.updated
        ? "Best score saved"
        : "Existing best score was kept",
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
      storyId: player.storyId,
      difficulty: player.difficulty,
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

module.exports = {
  submitScore,
  getLeaderboard,
};