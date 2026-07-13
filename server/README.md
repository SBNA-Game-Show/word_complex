# Server — Word Complex Backend

Node.js + Express REST API. Serves game data from MongoDB Atlas and exposes endpoints consumed by the React client.

## Stack

- **Node.js + Express 5** — REST API
- **MongoDB Atlas** — cloud database (`word_complex` db, `tokenized_stories` collection)
- **Mongoose** — used only in test config (MongoMemoryServer connection)
- **Jest + MongoMemoryServer** — testing (in-memory DB, no real Atlas connection needed)
- **Docker** — containerized with docker-compose

## Structure

```
server/
├── config/                        # DB config, env config, test DB config
│   ├── dataConnectConfig.js       # MongoDB Atlas connection
│   ├── envconfig.js               # Environment variable loader
│   └── testdbconfig.js            # MongoMemoryServer manager for Jest tests
├── meaning-bridge/                # Meaning Bridge game module
│   ├── controller/                # Route handlers
│   ├── middleware/                # API key protection (optional)
│   ├── routes/                    # Express router
│   └── service/                   # Puzzle generation, scoring, round/score store
├── wordhunt/                      # Word Hunt game module
├── raw-data-connect/              # MongoDB data retrieval functions
│   ├── retrieveTokenizedStoryById.js   # retrieveStoryById(), retrieveRandomStory()
│   └── retrieveAllTokenizedStories.js
├── middleware/                    # Shared middleware
│   ├── requireAdmin.js            # Admin protection (defined but not yet used)
│   └── ...
├── views/                         # HTML error pages (401, 403, 404)
├── explore-stories.js             # Dev script — prints raw MongoDB story structure
├── app.js                         # Express app setup and route registration
└── server.js                      # Entry point — starts the HTTP server
```

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/v1/meaningBridge/health` | No | Health check |
| GET | `/api/v1/meaningBridge/debug-story` | No | Returns raw MongoDB story (dev only) |
| POST | `/api/v1/meaningBridge/generate` | Optional API key | Generate word-match puzzle |
| POST | `/api/v1/meaningBridge/generate-sentence` | Optional API key | Generate sentence-match puzzle |
| POST | `/api/v1/meaningBridge/submit` | Optional API key | Submit round answers, returns score |
| GET | `/api/v1/meaningBridge/leaderboard` | Optional API key | Get top scores (in-memory, per server run) |
| POST | `/api/v1/meaningBridge/score` | Optional API key | Save finished session to `meaning-bridge` collection (one doc per player, best attempt only) |
| GET | `/api/v1/meaningBridge/score/leaderboard` | Optional API key | Persistent leaderboard from `meaning-bridge` collection |
| GET | `/api/v1/wordHunt` | No | Word hunt game data |

## Meaning Bridge Data Flow

```
MongoDB Atlas (tokenized_stories)
  → retrieveRandomStory()           — picks 1 random story via $sample
  → generatePuzzleFromTokenizedStory()  — extracts word pairs from tokens
      fallback: transliteration pairs from sanskritVersion + transliteratedVersion
  → saveRoundFallback()             — stores puzzle in memory for scoring
  → returns { puzzle, story } to frontend
```

### Best-score persistence (`meaning-bridge` collection)

After a finished session (3 rounds), the client POSTs `/api/v1/meaningBridge/score`
with `{ uuid, playerName, score, timeSeconds, accuracy }`. One document per player,
keyed by Firebase UID as `_id` (same convention as the other games):

```
{ _id, displayName, bestScore, bestTime (ms), accuracy, attemptsPlayed, createdAt, updatedAt }
```

Only the highest attempt is kept: a higher score (or equal score with faster time)
replaces `bestScore` / `bestTime` / `accuracy` together; worse attempts only
increment `attemptsPlayed`. Leaderboard sorts by `bestScore` desc, `bestTime` asc.
Code: `meaning-bridge/db/meaningBridgeCollection.js` + `meaning-bridge/service/meaningBridgeScoreService.js`.

## Running Locally

```bash
npm install
npm run dev      # nodemon with hot reload
npm start        # production
npm test         # Jest test suite
```

Runs at `http://localhost:5000`

## Running with Docker

```bash
docker-compose up
```

## Testing

- **Framework**: Jest only (no Playwright — that is only in the ignored `trialnextjs` folder)
- **Test DB**: `MongoMemoryServer` — spins up an in-memory MongoDB, no Atlas connection needed
- **DBManager class** (`config/testdbconfig.js`) — reusable test DB lifecycle manager
  - `start()` — spins up in-memory DB
  - `getDb()` — returns DB instance for inserting test data
  - `cleanup()` — wipes all collections between tests
  - `stop()` — shuts down after all tests

Test files:
- `raw-data-connect/raw-data-connect.test.js`
- `meaning-bridge/meaningbridge.test.js`
- `meaning-bridge/meaningbridgeservice.test.js`
- `wordhunt/wordhunt.test.js`

## Notes

- `ATLAS_URI` must be set in `server/.env`
- MongoDB Atlas IP whitelist must include your current network IP
- `requireAdmin` middleware exists but is not attached to any route yet
- Round and score data is stored in-memory (resets on server restart) — not persisted to MongoDB yet
- `explore-stories.js` is a dev-only script to inspect the raw MongoDB story structure: `node explore-stories.js`
