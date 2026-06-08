# Meaning Bridge Backend Integration

**Project:** Word Complex  
**Game:** Meaning Bridge  
**Backend framework:** Express + CommonJS  
**Test framework:** Jest + Supertest  
**Recommended location:** `server/meaning-bridge/README.md`

---

## 1. Purpose

This backend module powers Meaning Bridge in the Word Complex platform. It generates matching puzzles, validates submitted matches, calculates scores, stores fallback round/leaderboard data in memory, and exposes API routes consumed by the Vite/React frontend.

This backend was migrated from the standalone Meaning Bridge POC into Bhoj's existing Express server architecture.

---

## 2. Where this backend code lives

Place this README here:

```text
server/meaning-bridge/README.md
```

Primary backend files:

```text
server/meaning-bridge/controller/meaningbridgecontroller.js
server/meaning-bridge/routes/meaningbridgeroutes.js
server/meaning-bridge/middleware/apikey.js

server/meaning-bridge/data/dictionary.js
server/meaning-bridge/data/passages.js

server/meaning-bridge/service/generatepuzzle.js
server/meaning-bridge/service/scoreround.js
server/meaning-bridge/service/validatematches.js
server/meaning-bridge/service/selectrandompassage.js
server/meaning-bridge/service/roundstore.js
server/meaning-bridge/service/scorestore.js

server/meaning-bridge/meaningbridge.test.js
server/meaning-bridge/meaningbridgeservice.test.js
```

Route registration happens in:

```text
server/app.js
```

Expected registration:

```js
const meaningBridge = require("./meaning-bridge/routes/meaningbridgeroutes");

app.use("/api/v1/meaningBridge", meaningBridge);
```

---

## 3. API routes

Base path:

```text
/api/v1/meaningBridge
```

Routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Confirms the module is registered |
| `POST` | `/generate` | Generates a new puzzle round |
| `POST` | `/submit` | Scores a submitted round |
| `GET` | `/leaderboard?limit=5` | Returns fallback leaderboard records |

---

## 4. Health route

Request:

```text
GET http://localhost:5000/api/v1/meaningBridge/health
```

Expected response:

```json
{
  "success": true,
  "ok": true,
  "game": "meaning_bridge",
  "status": "ready",
  "message": "Meaning Bridge backend module is registered."
}
```

---

## 5. Generate route

Request:

```text
POST http://localhost:5000/api/v1/meaningBridge/generate
```

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "mode": "english-to-sanskrit",
  "difficulty": "easy",
  "pairCount": 4
}
```

Supported modes:

```text
english-to-sanskrit
sanskrit-to-english
word-to-definition
word-to-synonym
word-to-antonym
```

Supported difficulties:

```text
easy
medium
hard
```

Supported pair counts:

```text
4
5
6
```

Example response shape:

```json
{
  "success": true,
  "ok": true,
  "puzzle": {
    "gameId": "meaning_bridge",
    "roundId": "round_...",
    "passageId": "passage_001",
    "chunkId": "chunk_001",
    "mode": "english-to-sanskrit",
    "difficulty": "easy",
    "instruction": "Connect each word to its correct meaning or Sanskrit translation.",
    "leftItems": [],
    "rightItems": [],
    "answerKey": {},
    "hints": {},
    "scoreRules": {
      "correct": 10,
      "incorrect": 0,
      "hintPenalty": 2,
      "wrongAttemptPenalty": 5
    }
  },
  "passage": {
    "passageId": "passage_001",
    "chunkId": "chunk_001",
    "title": "The King and the Forest",
    "difficulty": "easy",
    "theme": "nature",
    "text": "..."
  }
}
```

---

## 6. Submit route

Request:

```text
POST http://localhost:5000/api/v1/meaningBridge/submit
```

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "roundId": "round_example",
  "playerName": "Nawaf",
  "matches": [
    {
      "leftId": "left_0_king",
      "rightId": "right_0_king"
    }
  ],
  "timeSeconds": 15,
  "hintsUsed": 0,
  "wrongAttempts": 0
}
```

For a perfect score, the `matches` array must include every correct pair from the generated round's `answerKey`.

Example success response:

```json
{
  "success": true,
  "ok": true,
  "score": 40,
  "accuracy": 100,
  "correctMatches": 4,
  "incorrectMatches": 0,
  "totalMatches": 4,
  "wrongAttempts": 0,
  "roundPoints": 1,
  "perfectRound": true,
  "message": "Excellent work! Perfect round point earned.",
  "timeSeconds": 15,
  "hintsUsed": 0,
  "scoreRecord": {},
  "playerRecord": {}
}
```

---

## 7. Leaderboard route

Request:

```text
GET http://localhost:5000/api/v1/meaningBridge/leaderboard?limit=5
```

Example response:

```json
{
  "success": true,
  "ok": true,
  "source": "fallback",
  "scores": []
}
```

Current leaderboard storage is fallback/in-memory only. It resets when the server restarts.

---

## 8. Scoring rules

Current scoring behavior:

```text
Correct match: +10
Incorrect submitted match: +0
Hint penalty: -2
Wrong attempt penalty: -5
Minimum score: 0
```

Round point behavior:

```text
+1 round point only when:
  - every pair is correctly matched
  - no incorrect submitted match exists
  - wrongAttempts is 0
```

A player can still receive a high score with penalties, but the round point is only awarded for a clean perfect round.

---

## 9. Optional API key protection

Middleware file:

```text
server/meaning-bridge/middleware/apikey.js
```

Environment variables:

```env
MEANING_BRIDGE_REQUIRE_API_KEY=true
MEANING_BRIDGE_API_KEY=your-server-side-key
```

Required header when enabled:

```text
x-meaning-bridge-api-key: your-server-side-key
```

Protected routes:

```text
POST /api/v1/meaningBridge/generate
POST /api/v1/meaningBridge/submit
GET  /api/v1/meaningBridge/leaderboard
```

Open route:

```text
GET /api/v1/meaningBridge/health
```

Recommended for current frontend migration:

```env
MEANING_BRIDGE_REQUIRE_API_KEY=false
```

or leave it unset while testing the browser client locally.

Do not commit real API keys.

---

## 10. Running backend locally

From the server folder:

```powershell
cd C:\Users\Nawaf\Desktop\word_complex\server
npm install
npm start
```

Expected:

```text
Backend listening on port 5000
```

---

## 11. Running backend tests

From the server folder:

```powershell
cd C:\Users\Nawaf\Desktop\word_complex\server
npm test
```

Current expected test state after migration work:

```text
4 test suites passed
29 tests passed
```

---

## 12. Postman testing checklist

### Health

```text
GET http://localhost:5000/api/v1/meaningBridge/health
```

### Generate

```text
POST http://localhost:5000/api/v1/meaningBridge/generate
```

Body:

```json
{
  "mode": "english-to-sanskrit",
  "difficulty": "easy",
  "pairCount": 4
}
```

### Submit

Use the `roundId` and `answerKey` from the generate response.

```text
POST http://localhost:5000/api/v1/meaningBridge/submit
```

Body:

```json
{
  "roundId": "round_from_generate_response",
  "playerName": "Nawaf",
  "matches": [
    {
      "leftId": "left_id_from_answer_key",
      "rightId": "right_id_from_answer_key"
    }
  ],
  "timeSeconds": 15,
  "hintsUsed": 0,
  "wrongAttempts": 0
}
```

### Leaderboard

```text
GET http://localhost:5000/api/v1/meaningBridge/leaderboard?limit=5
```

---

## 13. Current limitations

- Round storage is in-memory fallback storage.
- Leaderboard storage is in-memory fallback storage.
- Data currently comes from seed files.
- MongoDB persistence can be added later using the existing server architecture.
- API key protection is optional and disabled unless explicitly enabled through environment variables.

---

## 14. Team editing guide

When editing backend behavior:

| Change type | File to edit |
| --- | --- |
| Add/change passages | `data/passages.js` |
| Add/change dictionary words | `data/dictionary.js` |
| Change puzzle generation | `service/generatepuzzle.js` |
| Change scoring | `service/scoreround.js` |
| Change match validation | `service/validatematches.js` |
| Change API response format | `controller/meaningbridgecontroller.js` |
| Change routes | `routes/meaningbridgeroutes.js` |
| Change API key behavior | `middleware/apikey.js` |
| Change fallback leaderboard behavior | `service/scorestore.js` |
| Change fallback round storage | `service/roundstore.js` |

Always run:

```powershell
npm test
```

after backend changes.
