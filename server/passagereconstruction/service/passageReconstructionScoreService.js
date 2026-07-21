/**
 * passageReconstructionScoreService.js
 * --------------------------------------------------------------------------
 * Score recording + top-X for Passage Reconstruction, under the federated
 * leaderboard model (each game owns its collection + top-X function).
 *
 * Collection: `passage_reconstruction` — ONE doc per player, best run only:
 *   { _id: uuid, displayName, bestScore, bestTime, hintsUsed, storyId, updatedAt }
 *
 * A "run" is better than the stored one when (checked in order):
 *   1. higher score
 *   2. equal score, lower time
 *   3. equal score + time, fewer hints
 *   4. all equal -> keep existing (first one recorded stays best)
 *
 * The whole run replaces the doc atomically — score, time, and hints always
 * come from the SAME run, never mixed across runs.
 *
 * Max possible score = 750 (3 rounds x 100, + 5 pts per second left on the
 * 90s clock at finish; penalties only subtract).
 * --------------------------------------------------------------------------
 */

const {
  getPassageReconstructionCollection,
} = require("../db/passageReconstructionCollection");
const { writeFirebaseDB } = require("../../firebase/firebasePlayLog");

/** true when run A beats run B under score -> time -> hints. */
function isBetterRun(a, b) {
  if (a.score !== b.score) return a.score > b.score;
  if (a.time !== b.time) return a.time < b.time;
  return a.hintsUsed < b.hintsUsed;
}

async function saveBestRun({
  uuid,
  displayName,
  score,
  time,
  hintsUsed,
  storyId,
}) {
  if (!uuid || typeof uuid !== "string") {
    throw new Error("uuid is required");
  }
  if (!Number.isFinite(score) || score < 0) {
    throw new Error("score must be a non-negative number");
  }
  if (!Number.isFinite(time) || time < 0) {
    throw new Error("time must be a non-negative number");
  }
  if (!Number.isFinite(hintsUsed) || hintsUsed < 0) {
    throw new Error("hintsUsed must be a non-negative number");
  }

  // Mirror every play to Firestore (before the best-check below, so non-best
  // attempts still get logged). time is in ms; the mirror wants seconds.
  writeFirebaseDB({
    uuid,
    score,
    gameTimeSeconds: time / 1000,
    miniGame: "passageReconstruction",
  });

  const collection = await getPassageReconstructionCollection();
  const current = await collection.findOne({ _id: uuid });

  const isBetter =
    !current ||
    isBetterRun(
      { score, time, hintsUsed },
      { score: current.bestScore, time: current.bestTime, hintsUsed: current.hintsUsed },
    );

  if (!isBetter) {
    return { updated: false };
  }

  await collection.updateOne(
    { _id: uuid },
    {
      $set: {
        displayName: displayName || "Player",
        bestScore: score,
        bestTime: time,
        hintsUsed,
        storyId,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return { updated: true };
}

async function getTopPlayers(limit = 10) {
  const collection = await getPassageReconstructionCollection();
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  return collection
    .find({})
    .sort({ bestScore: -1, bestTime: 1, hintsUsed: 1 })
    .limit(safeLimit)
    .toArray();
}

module.exports = { saveBestRun, getTopPlayers };
