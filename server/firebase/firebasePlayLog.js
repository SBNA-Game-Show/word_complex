/**
 * firebasePlayLog.js
 * --------------------------------------------------------------------------
 * Standalone, best-effort "log every play" writer for the Firestore
 * leaderboard mirror. NOT yet wired into any game — this file only DEFINES
 * the function; the four call sites get added later, once we confirm how.
 *
 * Firestore layout (word-complex is a SIBLING of the bp26-Game* docs):
 *
 *   leaderboards (collection)
 *    └─ word-complex (document)                // one-time { label } set by hand
 *        └─ <miniGame> (sub-collection)         // one of MINI_GAMES below
 *            └─ <YYYY-MM> (document, monthly)    // sharded to dodge the 1MB cap
 *                └─ entries (map field)
 *                    └─ "<Date.now()>_<uuid>_<seconds>": <score>
 *
 * One play == one key in the monthly doc's `entries` map. Keys never collide
 * or overwrite because Date.now() (ms) is baked into every key.
 *
 * AUTH: Firebase Admin SDK with a service-account key. This is a SERVER-ONLY
 * secret and is NOT the public VITE_FIREBASE_* web config the client uses for
 * auth — that config cannot authorize server writes. Same Firebase *project*,
 * different (and privileged) credential.
 *
 * PREREQS (intentionally NOT done yet — this file is inert until then):
 *   1. npm install firebase-admin
 *   2. put the service-account JSON (single-line string) in the env var named
 *      by SERVICE_ACCOUNT_ENV below. The name is provisional — rename to match
 *      whatever you create.
 * --------------------------------------------------------------------------
 */

require("dotenv").config();
// firebase-admin v14 dropped the old namespaced API (admin.credential.*,
// admin.firestore(), admin.apps). Use the modular subpath imports instead.
const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore: getFirestoreInstance } = require("firebase-admin/firestore");

// --- config knobs (all provisional; rename freely) ----------------------

// Env var holding the service-account JSON, as a single-line JSON string.
const SERVICE_ACCOUNT_ENV = "FIREBASE_SERVICE_ACCOUNT_JSON";

// Top-level doc under `leaderboards`. Sibling of bp26-Game*.
const ROOT_COLLECTION = "leaderboards";
const WORD_COMPLEX_DOC = "word-complex";

// The only sub-collections writes are allowed to touch. Restricting to this
// set means a typo can never silently spawn a stray sub-collection.
const MINI_GAMES = Object.freeze({
  passageReconstruction: "passageReconstruction",
  meaningBridge: "meaningBridge",
  contextCloze: "contextCloze",
  wordHunt: "wordHunt",
});

// --- admin singleton ----------------------------------------------------

let firestore;

/** Lazily init the Admin SDK exactly once and return a Firestore handle. */
function getFirestore() {
  if (firestore) return firestore;

  if (!getApps().length) {
    const raw = process.env[SERVICE_ACCOUNT_ENV];
    if (!raw) {
      throw new Error(
        `Missing ${SERVICE_ACCOUNT_ENV} — the Firebase service-account key.`,
      );
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
    } catch (e) {
      throw new Error(`${SERVICE_ACCOUNT_ENV} is not valid JSON: ${e.message}`);
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  firestore = getFirestoreInstance();
  return firestore;
}

// --- helpers ------------------------------------------------------------

/**
 * "YYYY-MM" monthly shard id, derived from a ms timestamp. Uses UTC so the
 * shard boundary is stable regardless of where the server runs. Derived from
 * the SAME timestamp used in the entry key, so an entry always lands in the
 * month its own key names.
 */
function monthlyDocId(timestampMs) {
  const d = new Date(timestampMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// --- the function -------------------------------------------------------

/**
 * Log a single finished play into the Firestore leaderboard mirror.
 *
 * Best-effort: NEVER throws. Returns true on success, false on failure — so a
 * caller can `await` it or fire-and-forget with `.catch()`, and neither the
 * Mongo best-run write nor the gameplay response is ever blocked or broken by
 * a Firestore hiccup.
 *
 * NOTE ON PLACEMENT (for whoever wires this in): call this BEFORE any
 * "is this a new best?" early-return in the game's score service, or non-PB
 * plays will never get logged.
 *
 * @param {Object}  args
 * @param {string}  args.uuid             Firebase UID of the player.
 * @param {number}  args.score            Score for THIS play (the map value).
 * @param {number}  args.gameTimeSeconds  Seconds played this run (part of key).
 * @param {string}  args.miniGame         One of the MINI_GAMES keys.
 * @returns {Promise<boolean>}
 */
async function writeFirebaseDB({ uuid, score, gameTimeSeconds, miniGame }) {
  // Never touch real Firestore from the test runner (jest sets NODE_ENV=test).
  if (process.env.NODE_ENV === "test") return false;

  try {
    // --- validate -------------------------------------------------------
    const subCollection = MINI_GAMES[miniGame];
    if (!subCollection) {
      throw new Error(
        `Unknown miniGame "${miniGame}". Expected one of: ${Object.keys(
          MINI_GAMES,
        ).join(", ")}`,
      );
    }
    if (typeof uuid !== "string" || !uuid.trim()) {
      throw new Error("uuid must be a non-empty string");
    }
    if (!Number.isFinite(score)) {
      throw new Error(`score must be a finite number, got: ${score}`);
    }
    if (!Number.isFinite(gameTimeSeconds) || gameTimeSeconds < 0) {
      throw new Error(
        `gameTimeSeconds must be a non-negative number, got: ${gameTimeSeconds}`,
      );
    }

    // --- build the entry ------------------------------------------------
    // One timestamp drives both the key and the monthly shard it lands in.
    const now = Date.now();
    const seconds = Math.round(gameTimeSeconds); // keys stay integer, like existing data
    const key = `${now}_${uuid.trim()}_${seconds}`;

    const db = getFirestore();
    const docRef = db
      .collection(ROOT_COLLECTION)
      .doc(WORD_COMPLEX_DOC)
      .collection(subCollection)
      .doc(monthlyDocId(now));

    // merge:true deep-merges the map, so this ADDS one key without disturbing
    // existing entries, and creates the monthly doc + ancestor path if absent.
    await docRef.set({ entries: { [key]: score } }, { merge: true });

    return true;
  } catch (err) {
    // Swallow: this mirror is secondary. Log loud enough to spot in server logs.
    console.error("[writeFirebaseDB] failed to log play:", err.message);
    return false;
  }
}

module.exports = {
  writeFirebaseDB,
  MINI_GAMES,
  SERVICE_ACCOUNT_ENV,
};
