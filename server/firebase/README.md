# Firestore Play-Log (secondary store)

This folder writes a **second copy** of gameplay data to Firestore, completely
separate from MongoDB.

- **MongoDB** (each game's own collection) = the *leaderboard* store. One doc per
  player, **best run only**. Powers our in-game leaderboards.
- **Firestore** (this folder) = the *history* store. **Every play / run /
  attempt** a player finishes, logged forever, never overwritten.

The two are independent: the Firestore write is best-effort and never blocks or
breaks the Mongo write or the game response. If Firestore is down, players still
get their scores saved to Mongo as normal.

Firestore is shaped the way the **main zatam site** organizes its leaderboards
(same `leaderboards/<game>/…/entries` layout the `bp26-Game*` docs use), so the
site can read our data without any special-casing.

## Structure

```
leaderboards (collection)
 └─ word-complex (document)              ← sibling of bp26-Game*, holds a `label` field
     ├─ contextCloze          (sub-collection)   ← Fill in Blanks
     ├─ meaningBridge         (sub-collection)
     ├─ passageReconstruction (sub-collection)
     └─ wordHunt              (sub-collection)
          └─ 2026-07 (document, one per month)   ← sharded to stay under Firestore's 1 MB/doc cap
              └─ entries (map field)
                  └─ "<Date.now() ms>_<playerUUID>_<seconds>": <score>
```

**Key format:** `` `${Date.now()}_${uuid}_${gameTimeSeconds}` `` → value is the
score. `Date.now()` is milliseconds (13 digits); the trailing number is the run's
time in **whole seconds**. The ms timestamp makes every key unique, so plays
accumulate and never collide.

## The function

```js
const { writeFirebaseDB } = require("../../firebase/firebasePlayLog");

writeFirebaseDB({
  uuid,             // player's Firebase UID
  score,            // this run's score (the map value)
  gameTimeSeconds,  // this run's time, in SECONDS
  miniGame,         // one of: "contextCloze" | "meaningBridge" | "passageReconstruction" | "wordHunt"
});
```

- **Fire-and-forget** — it's called unawaited so it never adds latency to a
  score submit. It never throws (returns `true`/`false`, logs failures).
- **Call it on every finish**, before any "is this a new best?" early-return, so
  non-best attempts are logged too.
- Time must be **seconds**. Convert first if your game stores something else.

## Where it's wired in

| Mini-game | File | Time source → conversion |
|-----------|------|--------------------------|
| Fill in Blanks | `fillinblanks/services/contextClozeQuestScoreService.js` | `bestTime` (ms) → `/1000` |
| Passage Reconstruction | `passagereconstruction/service/passageReconstructionScoreService.js` | `time` (ms) → `/1000` |
| Meaning Bridge | `meaning-bridge/service/meaningBridgeScoreService.js` | `timeSeconds` (already seconds) |
| Word Hunt | `wordhunt/repository/wordhuntrepo.js` | `gameData.bestTime` (`"m:ss"` string) → parsed to seconds |

Word Hunt logs one entry per completed instance (Noun / Verb / Adjective).

## Setup

1. `npm install firebase-admin` (already a dependency).
2. Create a service-account key: Firebase Console → Project Settings →
   **Service accounts** → **Generate new private key**.
3. Put the JSON as a **single line** in `server/.env`, single-quoted:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account", ... }'
   ```
   (Minify with `node -e "console.log(JSON.stringify(require('./key.json')))"`.)
4. **Deploy:** add the same `FIREBASE_SERVICE_ACCOUNT_KEY` to the Render/Vercel
   backend environment — it's not in git.

The service-account key is a full-admin secret. Never commit it, never put it in
the client, never use the public `VITE_FIREBASE_*` web config for this (that's
client-only and can't authorize server writes).

## Notes

- Same Firebase **project** as client auth (`project_id: zat-am-main`), just a
  different, privileged credential.
- Uses the **firebase-admin v14 modular API** (`firebase-admin/app`,
  `firebase-admin/firestore`) — the old `admin.firestore()` namespaced style was
  removed in v14.
- **Tests:** `writeFirebaseDB` no-ops when `NODE_ENV === "test"`, so jest never
  touches real Firestore.
- The `word-complex` parent document needs a one-time `label` field set by hand
  (in the console); otherwise it shows greyed/italic as a "phantom" path doc.
