/**
 * progressCollection.js
 * --------------------------------------------------------------------------
 * The ONLY database access point for the daily-streak feature. It returns
 * exactly one collection — `progress` — and nothing else. There is no code
 * path from here to `players`, `tokenized_stories`, `storySets`, or any other
 * collection, so this feature is fully isolated from the rest of the data.
 *
 * Reuses the shared Mongo connection (config/dataConnectConfig.js) so the
 * whole server keeps one MongoClient. The `progress` collection is created
 * automatically by MongoDB on the first upsert — no manual setup. Every query
 * is keyed by _id (the Firebase UID, the primary key), so no extra index is
 * needed.
 * --------------------------------------------------------------------------
 */

const connectWordComplex = require("../../config/dataConnectConfig");
const { COLLECTION_NAME } = require("../progressConfig");

const getProgressCollection = async () => {
  const db = await connectWordComplex();
  return db.collection(COLLECTION_NAME);
};

module.exports = { getProgressCollection };
