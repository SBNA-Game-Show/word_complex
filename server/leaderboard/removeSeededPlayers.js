/**
 * removeSeededPlayers.js  —  DEV ONLY
 * --------------------------------------------------------------------------
 * Deletes the fake players created by seedLeaderboard.js and nothing else.
 * Every seeded player has an _id prefixed "seed-" (and a "Mock" surname), so
 * this targets only them — real player documents are never touched.
 *
 *   node leaderboard/removeSeededPlayers.js
 * --------------------------------------------------------------------------
 */

const { getPlayersCollection } = require("./db/playersCollection");
const connectWordComplex = require("../config/dataConnectConfig");

(async () => {
  const players = await getPlayersCollection();

  // _id is a string (Firebase UID for real players, "seed-*" for fakes).
  const result = await players.deleteMany({ _id: { $regex: /^seed-/ } });

  console.log(`🧹 Removed ${result.deletedCount} seeded (Mock) players.`);
  await connectWordComplex.close();
  process.exit(0);
})().catch((err) => {
  console.error("❌ Removal failed:", err);
  process.exit(1);
});
