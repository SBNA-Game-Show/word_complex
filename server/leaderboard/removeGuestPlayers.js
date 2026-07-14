/**
 * removeGuestPlayers.js  —  DEV ONLY
 * --------------------------------------------------------------------------
 * Deletes guest-account rows from every game's leaderboard collection.
 * Guests were never supposed to be recorded (fixed client-side on
 * 2026-07-13 with the authUser.isGuest gate); this sweeps out the rows
 * that got in before the fix.
 *
 * Anonymous Firebase users have normal-looking UIDs, so the only marker we
 * have is the display name the client sent ("Guest" / "Guest Reader").
 * Small caveat: a real player who named themselves exactly "Guest" would be
 * swept too — acceptable for a dev cleanup.
 *
 *   node leaderboard/removeGuestPlayers.js
 * --------------------------------------------------------------------------
 */

const connectToDatabase = require("../config/dataConnectConfig");

const GUEST_NAMES = ["Guest", "Guest Reader"];

// Every game collection that stores leaderboard rows, plus its name field.
const TARGETS = [
  { collection: "context_cloze_quest", field: "displayName" },
  { collection: "meaning-bridge", field: "displayName" },
  { collection: "passage_reconstruction", field: "displayName" },
  // WordHunt: no real collection yet (mock JSON) — add it here when it lands.
];

(async () => {
  const db = await connectToDatabase();
  let total = 0;

  for (const { collection, field } of TARGETS) {
    const result = await db
      .collection(collection)
      .deleteMany({ [field]: { $in: GUEST_NAMES } });
    console.log(`🧹 ${collection}: removed ${result.deletedCount} guest row(s).`);
    total += result.deletedCount;
  }

  console.log(`Done — ${total} guest row(s) removed in total.`);
  process.exit(0);
})().catch((err) => {
  console.error("❌ Guest cleanup failed:", err);
  process.exit(1);
});
