/**
 * storySetsService.js
 * -------------------
 * Single service for the `storySets` collection (admin-versioned groups of
 * stories) and the `config` pointer doc that marks which set is live.
 *
 * READ side: getActiveStoryIds() — consumed by stories/controller for the
 * story picker. Falls back to the static list in activeStoriesConfig.js when
 * nothing has been seeded yet (or the DB read fails), so the picker can never
 * come up empty because of this feature.
 *
 * WRITE side: list/create/update/delete/activate — consumed by the admin
 * endpoints only. DB-dependent consistency checks (do these storyIds exist?
 * does this set exist? is it active?) live HERE; pure shape checks live in the
 * controller, before anything touches the database.
 *
 * Design notes (see storySets-implementation-plan.md in the Week 9 folder):
 * - Sets are IMMUTABLE once created (decided 2026-07-08). No update operation.
 *   The admin "edits" by creating a new set, activating it, and deleting the
 *   old one. A set is identified by its story COMBINATION — creating a set
 *   with the same stories as an existing one (order-insensitive) is rejected
 *   with 409, so the collection can't fill up with duplicates.
 * - The active pointer is a separate one-doc `config` collection so activation
 *   is a single atomic write (no "two sets active" state possible).
 */

const { v4: uuidv4 } = require("uuid");
const connectDb = require("../config/dataConnectConfig");
const {
  retrieveStoryById,
} = require("../raw-data-connect/retrieveTokenizedStoryById");
const {
  getActiveStoryIds: getFallbackStoryIds,
} = require("../activeStoriesConfig");
/**
 * Importing Word hunt service to Initialize Game Repository with game id and
 * list of stories
 */
const { initWordHuntRepo } = require("../wordhunt/service/gameservice");

const SETS_COLLECTION = "storySets";
const CONFIG_COLLECTION = "config";
const ACTIVE_POINTER_ID = "activeStorySet";

/** Error carrying an HTTP status so the controller can map it 1:1. */
class StorySetError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "StorySetError";
    this.statusCode = statusCode;
  }
}

async function getCollections() {
  const db = await connectDb();
  return {
    sets: db.collection(SETS_COLLECTION),
    config: db.collection(CONFIG_COLLECTION),
  };
}

async function getActiveSetId() {
  const { config } = await getCollections();
  const pointer = await config.findOne({ _id: ACTIVE_POINTER_ID });
  return pointer?.setId ?? null;
}

/*
 * READ PATH — the story picker's source of truth.
 * pointer doc → active set → its storyIds; static fallback otherwise.
 * DB errors are swallowed into the fallback on purpose: a broken admin
 * feature must not take down the picker.
 */
async function getActiveStoryIds() {
  try {
    const setId = await getActiveSetId();
    if (setId) {
      const { sets } = await getCollections();
      const set = await sets.findOne({ _id: setId });
      if (set && Array.isArray(set.storyIds) && set.storyIds.length > 0) {
        return [...set.storyIds];
      }
    }
  } catch (error) {
    console.error(
      `storySets read failed, using static fallback: ${error.message}`,
    );
  }
  return getFallbackStoryIds();
}

/*
 * Consistency check: every id must resolve in tokenized_stories.
 * Returns the ids that DON'T, so the controller can name the offenders
 * (fail-loud contract — same spirit as the 400-on-missing-storyId rule).
 */
async function findUnknownStoryIds(storyIds) {
  const results = await Promise.all(
    storyIds.map(async (id) => {
      try {
        await retrieveStoryById(id);
        return null;
      } catch {
        return id;
      }
    }),
  );
  return results.filter(Boolean);
}

async function listSets() {
  const { sets } = await getCollections();
  const [allSets, activeSetId] = await Promise.all([
    sets.find({}).sort({ createdAt: -1 }).toArray(),
    getActiveSetId(),
  ]);
  return allSets.map((set) => ({ ...set, isActive: set._id === activeSetId }));
}

/*
 * Canonical identity of a set = its story combination, order-insensitive.
 * ["a","b"] and ["b","a"] are the same set.
 */
function canonicalKey(storyIds) {
  return [...storyIds].sort().join("|");
}

async function createSet({ name, storyIds }) {
  const { sets } = await getCollections();

  // Immutability guard: reject an already-existing story combination so the
  // collection can't accumulate infinite duplicate sets.
  const key = canonicalKey(storyIds);
  const existing = await sets.find({}).sort({ createdAt: -1 }).toArray();
  const duplicate = existing.find((set) => canonicalKey(set.storyIds) === key);
  if (duplicate) {
    throw new StorySetError(
      409,
      `Story set already exists: "${duplicate.name}" (${duplicate._id}) contains the same stories`,
    );
  }
  const unknown = await findUnknownStoryIds(storyIds);
  if (unknown.length > 0) {
    throw new StorySetError(400, `Unknown storyIds: ${unknown.join(", ")}`);
  }

  const doc = {
    _id: uuidv4(),
    name: name.trim(),
    storyIds: [...storyIds],
    createdAt: new Date(),
  };
  await sets.insertOne(doc);

<<<<<<< HEAD
  // initializing word hunt repo

  wordHunt_Ids = [...storyIds];
  wordHuntService = initWordHuntRepo(wordHunt_Ids, doc._id); // must be await initWordHuntRepo
=======
  // Initialize the Word Hunt repo for this set's stories. This is a secondary
  // side-effect: a failure here must not fail set creation (same fail-soft
  // spirit as the read path), so we await and swallow into a log.
  try {
    await initWordHuntRepo([...storyIds], doc._id);
  } catch (error) {
    console.error(
      `Word Hunt repo init failed for set ${doc._id}: ${error.message}`,
    );
  }
>>>>>>> development

  return doc;
}

async function deleteSet(setId) {
  const { sets } = await getCollections();

  const activeSetId = await getActiveSetId();
  if (setId === activeSetId) {
    throw new StorySetError(
      409,
      "Cannot delete the active story set — activate another set first",
    );
  }

  const result = await sets.deleteOne({ _id: setId });
  if (result.deletedCount === 0) {
    throw new StorySetError(404, `No story set found with id ${setId}`);
  }
}

async function activateSet(setId) {
  const { sets, config } = await getCollections();

  const set = await sets.findOne({ _id: setId });
  if (!set) {
    throw new StorySetError(404, `No story set found with id ${setId}`);
  }

  await config.updateOne(
    { _id: ACTIVE_POINTER_ID },
    { $set: { setId, updatedAt: new Date() } },
    { upsert: true },
  );
  return set;
}

module.exports = {
  StorySetError,
  getActiveStoryIds,
  getActiveSetId,
  listSets,
  createSet,
  deleteSet,
  activateSet,
  // exported for the seed script / tests
  SETS_COLLECTION,
  CONFIG_COLLECTION,
  ACTIVE_POINTER_ID,
};
