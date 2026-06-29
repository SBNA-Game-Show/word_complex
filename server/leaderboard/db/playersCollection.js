/**
 * playersCollection.js
 * --------------------------------------------------------------------------
 * Access layer for the `players` collection (the leaderboard's only store).
 *
 * Reuses the existing Mongo connection (config/dataConnectConfig.js) so the
 * whole server shares one MongoClient rather than opening a second pool.
 *
 * The collection itself is created automatically by MongoDB on the first
 * write. Indexes are NOT auto-created, so ensureLeaderboardIndexes() builds
 * them once per process the first time the collection is requested.
 * --------------------------------------------------------------------------
 */

const connectWordComplex = require("../../config/dataConnectConfig");
const { COLLECTION_NAME, GAME_KEYS } = require("../leaderboardConfig");

// Guard so we only issue createIndex() calls once per server process.
let indexesEnsured = false;

/**
 * Build the leaderboard indexes if they don't already exist.
 * - masterScore: the Master board sort.
 * - per game: { score desc, bestTime asc } so a faster time wins a score tie.
 * createIndex is idempotent, so re-running is harmless.
 */
const ensureLeaderboardIndexes = async (collection) => {
  if (indexesEnsured) return;

  await collection.createIndex({ masterScore: -1 }, { name: "masterScore_desc" });

  for (const game of GAME_KEYS) {
    await collection.createIndex(
      { [`${game}.score`]: -1, [`${game}.bestTime`]: 1 },
      { name: `${game}_score_time` },
    );
  }

  indexesEnsured = true;
};

/**
 * Return the players collection handle, ensuring indexes exist on first use.
 */
const getPlayersCollection = async () => {
  const db = await connectWordComplex();
  const collection = db.collection(COLLECTION_NAME);
  await ensureLeaderboardIndexes(collection);
  return collection;
};

module.exports = { getPlayersCollection, ensureLeaderboardIndexes };
