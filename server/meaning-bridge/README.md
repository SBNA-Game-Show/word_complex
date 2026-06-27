# Meaning Bridge — Backend Module

**Location:** `server/meaning-bridge/`  
**Base route:** `/api/v1/meaningBridge`

---

## What this module does

Generates word-matching puzzles from a tokenized story stored in MongoDB. The player matches words on the left to their synonyms, antonyms, or definitions on the right. Scoring is handled entirely on the client — the server only generates the puzzle and sends back the answer key.

---

## Files

```
meaning-bridge/
├── routes/
│   └── meaningbridgeroutes.js    # GET /health, POST /generate
├── controller/
│   └── meaningbridgecontroller.js  # validates input, calls service, returns response
└── service/
    └── generatepuzzle.js          # builds synonym / antonym / definition puzzles
```

Data comes from MongoDB via `../../raw-data-connect/retrieveTokenizedStoryById.js`.  
Route is registered in `server/app.js` as:

```js
app.use("/api/v1/meaningBridge", meaningBridge);
```

---

## Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/meaningBridge/health` | Health check — confirms module is registered |
| POST | `/api/v1/meaningBridge/generate` | Generates a word-match puzzle |

> `/submit` and `/leaderboard` routes have been removed for v1. Scoring is now client-side.

---

## How a request flows

```
POST /generate
  → controller reads { mode, pairCount } from request body
  → validates mode and pairCount
  → retrieveStoryById(hardcoded story ID) — fetches story from MongoDB Atlas
  → generatepuzzle.js picks tokens based on mode:
        word-to-synonym    →  uses token.synonyms[0]
        word-to-antonym    →  uses token.antonyms[0]
        word-to-definition →  uses token.definition
  → shuffles right-side items
  → builds answerKey and hints
  → returns puzzle to client
```

---

## GET `/health`

```
GET http://localhost:5000/api/v1/meaningBridge/health
```

Response:

```json
{
  "success": true,
  "ok": true,
  "game": "meaning_bridge",
  "status": "ready",
  "message": "Meaning Bridge backend is ready."
}
```

---

## POST `/generate`

```
POST http://localhost:5000/api/v1/meaningBridge/generate
Content-Type: application/json
```

Request body:

```json
{
  "mode": "word-to-synonym",
  "pairCount": 4
}
```

Supported modes: `word-to-synonym`, `word-to-antonym`, `word-to-definition`  
Supported pairCount: `4`, `5`, `6`

Response:

```json
{
  "success": true,
  "ok": true,
  "puzzle": {
    "gameId": "meaning_bridge",
    "roundId": "round_abc123",
    "mode": "word-to-synonym",
    "instruction": "Match each word to one of its synonyms.",
    "leftItems": [
      { "id": "left_0", "label": "forest", "sublabel": "noun" }
    ],
    "rightItems": [
      { "id": "right_0", "label": "woodland", "sublabel": "synonym" }
    ],
    "answerKey": { "left_0": "right_0" },
    "hints": { "left_0": "\"forest\" and \"woodland\" have the same meaning." },
    "scoreRules": { "correct": 10, "incorrect": 0, "hintPenalty": 2, "wrongAttemptPenalty": 5 }
  },
  "passage": {
    "passageId": "...",
    "title": "Story Title",
    "text": "First 300 characters of the story...",
    "theme": "Story"
  }
}
```

The client uses `answerKey` to check answers and `scoreRules` to calculate the score locally.

---

## Puzzle generation logic (`service/generatepuzzle.js`)

1. Reads `tokenized_english_version` array from the story
2. Skips tokens with uninteresting POS (punctuation, pronouns, determiners, etc.)
3. Builds word pairs based on mode (synonym / antonym / definition)
4. Deduplicates and shuffles, then slices to `pairCount`
5. Assigns `left_0`, `left_1`... IDs to word items and `right_0`, `right_1`... to match targets
6. Shuffles the right-side items so they are not in order
7. Returns `answerKey` mapping each left ID to the correct right ID

---

## Scoring rules (reference for client)

| Event | Points |
|-------|--------|
| Correct match | +10 |
| Incorrect match | 0 |
| Hint used | -2 |
| Wrong attempt | -5 |

Scoring happens on the client. The `scoreRules` object in the response contains these values.

---

## Notes

- Story ID is currently hardcoded in the controller (`HARDCODED_STORY_ID`). Random story selection can be added later.
- Tokens with no synonyms/antonyms/definitions are automatically skipped during puzzle generation.
- If the story doesn't have enough valid pairs for the requested mode, the server returns a 500 error.
- No API key protection is active on any route.
- No round or score data is stored on the server.
