const {
  getContextClozeQuestCollection,
} = require("../db/contextClozeQuestCollection");

async function saveBestScore({
  uuid,
  displayName,
  score,
  bestTime,
  storyId,
  difficulty,
}) {
  if (!uuid || typeof uuid !== "string") {
    throw new Error("uuid is required");
  }

  if (!Number.isFinite(score) || score < 0) {
    throw new Error("score must be a non-negative number");
  }

  if (!Number.isFinite(bestTime) || bestTime < 0) {
    throw new Error("bestTime must be a non-negative number");
  }

  const collection = await getContextClozeQuestCollection();
  const currentResult = await collection.findOne({ _id: uuid });

  const isBetterResult =
    !currentResult ||
    score > currentResult.bestScore ||
    (score === currentResult.bestScore &&
      bestTime < currentResult.bestTime);

  if (!isBetterResult) {
    return { updated: false };
  }

  await collection.updateOne(
    { _id: uuid },
    {
      $set: {
        displayName: displayName || "Player",
        bestScore: score,
        bestTime,
        storyId,
        difficulty,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return { updated: true };
}

async function getTopPlayers(limit = 10) {
  const collection = await getContextClozeQuestCollection();
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  return collection
    .find({})
    .sort({ bestScore: -1, bestTime: 1 })
    .limit(safeLimit)
    .toArray();
}

module.exports = {
  saveBestScore,
  getTopPlayers,
};