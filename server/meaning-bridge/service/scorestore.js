const globalForScores = globalThis;

const scores = globalForScores.__meaningBridgeScores || [];
const players = globalForScores.__meaningBridgePlayers || [];

globalForScores.__meaningBridgeScores = scores;
globalForScores.__meaningBridgePlayers = players;

function normalizePlayerName(playerName) {
  const trimmed = String(playerName || "").trim();

  if (!trimmed) {
    return "guest player";
  }

  return trimmed.toLowerCase().replace(/\s+/g, " ");
}

function buildUpdatedPlayerLeaderboardRecord(existing, score) {
  const normalizedPlayerName = normalizePlayerName(score.playerName);
  const playerName = String(score.playerName || "").trim() || "Guest Player";
  const createdAt = existing?.createdAt || score.createdAt;

  const roundsPlayed = (existing?.roundsPlayed || 0) + 1;
  const totalScore = (existing?.totalScore || 0) + score.score;
  const roundPoints = (existing?.roundPoints || 0) + score.roundPoints;
  const perfectRounds =
    (existing?.perfectRounds || 0) + (score.perfectRound ? 1 : 0);
  const failedRounds =
    (existing?.failedRounds || 0) + (score.roundPoints > 0 ? 0 : 1);

  const correctMatchesTotal =
    (existing?.correctMatchesTotal || 0) + score.correctMatches;
  const totalMatches = (existing?.totalMatches || 0) + score.totalMatches;

  const accuracyAverage =
    totalMatches === 0
      ? 0
      : Math.round((correctMatchesTotal / totalMatches) * 100);

  const wrongAttemptsTotal =
    (existing?.wrongAttemptsTotal || 0) + score.wrongAttempts;
  const hintsUsedTotal = (existing?.hintsUsedTotal || 0) + score.hintsUsed;

  const currentStreak =
    score.roundPoints > 0 ? (existing?.currentStreak || 0) + 1 : 0;

  const bestStreak = Math.max(existing?.bestStreak || 0, currentStreak);

  return {
    playerName,
    normalizedPlayerName,
    gameId: "meaning_bridge",
    totalScore,
    roundPoints,
    roundsPlayed,
    perfectRounds,
    failedRounds,
    accuracyAverage,
    correctMatchesTotal,
    totalMatches,
    wrongAttemptsTotal,
    hintsUsedTotal,
    bestRoundScore: Math.max(existing?.bestRoundScore || 0, score.score),
    lastRoundScore: score.score,
    currentStreak,
    bestStreak,
    createdAt,
    updatedAt: score.createdAt,
    lastPlayedAt: score.createdAt,
  };
}

function compareLeaderboardPlayers(first, second) {
  return (
    second.roundPoints - first.roundPoints ||
    second.totalScore - first.totalScore ||
    second.accuracyAverage - first.accuracyAverage ||
    Date.parse(second.updatedAt) - Date.parse(first.updatedAt)
  );
}

function saveScoreFallback(score) {
  scores.unshift(score);

  const normalizedPlayerName = normalizePlayerName(score.playerName);
  const existingIndex = players.findIndex(
    (player) =>
      player.gameId === "meaning_bridge" &&
      player.normalizedPlayerName === normalizedPlayerName,
  );

  const existingPlayer = existingIndex >= 0 ? players[existingIndex] : null;
  const updatedPlayer = buildUpdatedPlayerLeaderboardRecord(
    existingPlayer,
    score,
  );

  if (existingIndex >= 0) {
    players[existingIndex] = updatedPlayer;
  } else {
    players.push(updatedPlayer);
  }

  return updatedPlayer;
}

function getScoresFallback(limit = 10) {
  return scores.slice(0, limit);
}

function getPlayerLeaderboardFallback(limit = 10) {
  return [...players].sort(compareLeaderboardPlayers).slice(0, limit);
}

function resetScoreFallbackForTests() {
  scores.splice(0, scores.length);
  players.splice(0, players.length);
}

module.exports = {
  normalizePlayerName,
  buildUpdatedPlayerLeaderboardRecord,
  saveScoreFallback,
  getScoresFallback,
  getPlayerLeaderboardFallback,
  resetScoreFallbackForTests,
};
