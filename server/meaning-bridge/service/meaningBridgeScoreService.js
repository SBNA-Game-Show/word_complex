/**
 * meaningBridgeScoreService.js
 * --------------------------------------------------------------------------
 * Write/read service for the `meaning-bridge` collection.
 *
 * Document shape matches the other games' collections: _id = Firebase UID,
 * displayName, bestScore, bestTime (in MILLISECONDS — team convention, same
 * as the shared leaderboard's submitLeaderboardScore).
 *
 * saveBestScore: called once per finished session (3 rounds). The caller
 * passes timeSeconds (what the game tracks); it is converted to ms here.
 * Only the player's HIGHEST attempt is kept:
 *   - higher score        → replaces score, time and accuracy (new best)
 *   - same score, faster  → replaces time (faster run of the same best)
 *   - anything worse      → ignored (attempt counter still increments)
 * Retries and out-of-order submits are safe because the update is atomic.
 *
 * getTopPlayers: leaderboard read — one row per player, best score first.
 * --------------------------------------------------------------------------
 */

const { getMeaningBridgeCollection } = require("../db/meaningBridgeCollection");
const { writeFirebaseDB } = require("../../firebase/firebasePlayLog");

const assertNonNegativeNumber = (value, label) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number, got: ${value}`);
  }
};

/**
 * Record a finished session for a player. One doc per uuid (_id), best
 * attempt only.
 *
 * @param {Object} args
 * @param {string} args.uuid         Firebase UID — becomes the document _id.
 * @param {string} args.playerName   Display name (latest one always wins).
 * @param {number} args.score        Total session score.
 * @param {number} args.timeSeconds  Total session time in seconds (stored as ms).
 * @param {number} [args.accuracy]   Session accuracy 0-100.
 * @returns {Promise<{ isNewBest: boolean, entry: Object }>}
 */
const saveBestScore = async ({
  uuid,
  playerName,
  score,
  timeSeconds,
  accuracy = 0,
}) => {
  const safeUuid = String(uuid || "").trim();

  if (!safeUuid) {
    throw new Error("uuid is required to save a Meaning Bridge score.");
  }

  assertNonNegativeNumber(score, "score");
  assertNonNegativeNumber(timeSeconds, "timeSeconds");

  const safeName = String(playerName || "").trim().slice(0, 40) || "Guest";
  const safeAccuracy = Math.max(0, Math.min(100, Number(accuracy) || 0));

  // Team convention: times live in the DB as milliseconds (e.g. 51000 = 51s).
  const timeMs = Math.round(timeSeconds * 1000);

  const collection = await getMeaningBridgeCollection();

  // Aggregation-pipeline update so "keep the best" happens atomically in the
  // DB — no read-modify-write race between two submits from the same player.
  const pipeline = [
    {
      $set: {
        displayName: safeName,
        attemptsPlayed: { $add: [{ $ifNull: ["$attemptsPlayed", 0] }, 1] },
        createdAt: { $ifNull: ["$createdAt", "$$NOW"] },
        updatedAt: "$$NOW",
        // Temp flag: is this attempt strictly better than what's stored?
        _isNewBest: {
          $or: [
            { $gt: [score, { $ifNull: ["$bestScore", -1] }] },
            {
              $and: [
                { $eq: [score, { $ifNull: ["$bestScore", -1] }] },
                {
                  $lt: [
                    timeMs,
                    { $ifNull: ["$bestTime", Number.MAX_SAFE_INTEGER] },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    {
      $set: {
        bestScore: {
          $cond: ["$_isNewBest", score, { $ifNull: ["$bestScore", 0] }],
        },
        bestTime: {
          $cond: ["$_isNewBest", timeMs, { $ifNull: ["$bestTime", timeMs] }],
        },
        accuracy: {
          $cond: ["$_isNewBest", safeAccuracy, { $ifNull: ["$accuracy", 0] }],
        },
      },
    },
    { $unset: "_isNewBest" },
  ];

  // Read the previous best first so we can tell the caller if this was a PB.
  const previous = await collection.findOne(
    { _id: safeUuid },
    { projection: { bestScore: 1, bestTime: 1 } },
  );

  const isNewBest =
    !previous ||
    score > (previous.bestScore ?? -1) ||
    (score === (previous.bestScore ?? -1) &&
      timeMs < (previous.bestTime ?? Number.MAX_SAFE_INTEGER));

  const result = await collection.findOneAndUpdate(
    { _id: safeUuid },
    pipeline,
    { upsert: true, returnDocument: "after" },
  );

  // Mirror every play to Firestore. timeSeconds is already seconds — no
  // conversion needed.
  writeFirebaseDB({
    uuid: safeUuid,
    score,
    gameTimeSeconds: timeSeconds,
    miniGame: "meaningBridge",
  });

  return { isNewBest, entry: result || null };
};

/**
 * Top players, one row each, best score first (faster time breaks ties).
 * Shaped to match what the game's leaderboard scene already renders.
 */
const getTopPlayers = async (limit = 10) => {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));

  const collection = await getMeaningBridgeCollection();

  const docs = await collection
    .find({})
    .sort({ bestScore: -1, bestTime: 1 })
    .limit(safeLimit)
    .toArray();

  return docs.map((doc) => ({
    uuid: doc._id,
    playerName: doc.displayName || "Bridge Builder",
    totalScore: doc.bestScore || 0,
    bestTime: doc.bestTime || 0, // milliseconds
    accuracyAverage: doc.accuracy || 0,
    roundsPlayed: doc.attemptsPlayed || 0,
    sessionComplete: true,
  }));
};

module.exports = { saveBestScore, getTopPlayers };
