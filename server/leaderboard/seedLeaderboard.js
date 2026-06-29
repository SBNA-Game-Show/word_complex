/**
 * seedLeaderboard.js  —  DEV ONLY
 * --------------------------------------------------------------------------
 * Populates the leaderboard with a handful of fake players so the board has
 * something to show during development / the demo. Writes to the real
 * `players` collection in Atlas, so only run this against a dev database.
 *
 *   node leaderboard/seedLeaderboard.js
 *
 * Scores go through the real submitLeaderboardScore path (so masterScore and
 * the guards are exercised). Display names + avatars are set directly here,
 * standing in for the profile write the client will eventually do on login.
 * --------------------------------------------------------------------------
 */

const { submitLeaderboardScore } = require("./service/leaderboardWriteService");
const { getPlayersCollection } = require("./db/playersCollection");
const connectWordComplex = require("../config/dataConnectConfig");

// [score 0-100, bestTime ms] per game. Missing games = not played.
const SEED = [
  { uuid: "seed-aisha", name: "Aisha Mock", avatar: "luna",
    games: { WordHunt: [96, 41200], PassageReconstruction: [88, 60500], ContextQuiz: [91, 30100], MeaningBridge: [84, 52300] } },
  { uuid: "seed-marco", name: "Marco Mock", avatar: "bolt",
    games: { WordHunt: [92, 39800], PassageReconstruction: [90, 58200], ContextQuiz: [80, 33400] } },
  { uuid: "seed-priya", name: "Priya Mock", avatar: "berry",
    games: { WordHunt: [89, 45000], MeaningBridge: [93, 47000], ContextQuiz: [78, 36000] } },
  { uuid: "seed-jacob", name: "Jacob Mock", avatar: "comet",
    games: { WordHunt: [85, 50000], PassageReconstruction: [76, 64000] } },
  { uuid: "seed-sana", name: "Sana Mock", avatar: "sprout",
    games: { WordHunt: [82, 47500], ContextQuiz: [88, 31000], MeaningBridge: [70, 55000] } },
  { uuid: "seed-theo", name: "Theo Mock", avatar: "cap",
    games: { WordHunt: [79, 52000], MeaningBridge: [81, 49000] } },
  { uuid: "seed-mei", name: "Mei Mock", avatar: "bubbles",
    games: { ContextQuiz: [95, 28000], PassageReconstruction: [83, 61000] } },
  { uuid: "seed-omar", name: "Omar Mock", avatar: "tomely",
    games: { WordHunt: [74, 56000], ContextQuiz: [72, 38000] } },
];

(async () => {
  const players = await getPlayersCollection();

  for (const p of SEED) {
    for (const [game, [score, bestTime]] of Object.entries(p.games)) {
      await submitLeaderboardScore({ uuid: p.uuid, game, score, bestTime });
    }
    // profile fields (name + avatar) — placeholder for the client login upsert
    await players.updateOne(
      { _id: p.uuid },
      { $set: { displayName: p.name, avatar: p.avatar } },
    );
    console.log(`seeded ${p.name}`);
  }

  console.log(`\n✅ Seeded ${SEED.length} players.`);
  await connectWordComplex.close();
  process.exit(0);
})().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
