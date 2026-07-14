/**
 * meaningBridgeCollection.js
 * --------------------------------------------------------------------------
 * Access layer for the `meaning-bridge` collection — Meaning Bridge's own
 * store, separate from the shared `players` collection (which belongs to the
 * cross-game leaderboard and is only written via submitLeaderboardScore).
 *
 * One document per player, using the Firebase UID as the document _id — the
 * same shape the other games' collections use:
 *   {
 *     _id:         "firebase-uid",     // one player = one doc, enforced by _id
 *     displayName: "Wasiq",            // latest display name
 *     bestScore:   180,                // highest session score
 *     bestTime:    145000,             // time of that best session, in MILLISECONDS
 *     accuracy:    92,                 // accuracy of that best session (0-100)
 *     attemptsPlayed: 4,               // sessions submitted (all time)
 *     createdAt / updatedAt
 *   }
 *
 * Reuses the shared Mongo connection (config/dataConnectConfig.js) so the
 * server keeps a single client pool. The collection is created by MongoDB on
 * first write.
 * --------------------------------------------------------------------------
 */

const connectWordComplex = require("../../config/dataConnectConfig");

const MEANING_BRIDGE_COLLECTION = "meaning-bridge";

// Guard so index creation only runs once per server process (createIndex is
// idempotent anyway, but no point re-issuing it on every request).
let indexesEnsured = false;

const ensureMeaningBridgeIndexes = async (collection) => {
  if (indexesEnsured) return;

  // Leaderboard sort: highest score first, faster time (ms) breaks ties.
  // Uniqueness needs no index — the Firebase UID is the _id.
  await collection.createIndex(
    { bestScore: -1, bestTime: 1 },
    { name: "bestScore_bestTime" },
  );

  indexesEnsured = true;
};

const getMeaningBridgeCollection = async () => {
  const db = await connectWordComplex();
  const collection = db.collection(MEANING_BRIDGE_COLLECTION);
  await ensureMeaningBridgeIndexes(collection);
  return collection;
};

module.exports = {
  getMeaningBridgeCollection,
  ensureMeaningBridgeIndexes,
  MEANING_BRIDGE_COLLECTION,
};
