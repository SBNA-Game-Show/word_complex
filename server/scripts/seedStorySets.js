/**
 * seedStorySets.js — one-time migration from the static config to the DB.
 *
 * Creates one story set from the 4 IDs in activeStoriesConfig.js and marks it
 * active, so the picker reads identical data before/after the swap.
 * Idempotent: does nothing if any set already exists.
 *
 * Run from server/:  node scripts/seedStorySets.js   (needs ATLAS_URI in .env)
 */

const { v4: uuidv4 } = require("uuid");
const connectDb = require("../config/dataConnectConfig");
const { getActiveStoryIds } = require("../activeStoriesConfig");
const {
  SETS_COLLECTION,
  CONFIG_COLLECTION,
  ACTIVE_POINTER_ID,
} = require("../storySets/storySetsService");

(async () => {
  try {
    const db = await connectDb();
    const sets = db.collection(SETS_COLLECTION);
    const config = db.collection(CONFIG_COLLECTION);

    const existing = await sets.countDocuments();
    if (existing > 0) {
      console.log(`storySets already has ${existing} set(s) — nothing to do.`);
      return;
    }

    const now = new Date();
    const doc = {
      _id: uuidv4(),
      name: "Initial set (seeded from static config)",
      storyIds: getActiveStoryIds(),
      createdAt: now,
    };

    await sets.insertOne(doc);
    await config.updateOne(
      { _id: ACTIVE_POINTER_ID },
      { $set: { setId: doc._id, updatedAt: now } },
      { upsert: true },
    );

    console.log(`✅ Seeded story set ${doc._id} (${doc.storyIds.length} stories) and marked it active.`);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await connectDb.close();
  }
})();
