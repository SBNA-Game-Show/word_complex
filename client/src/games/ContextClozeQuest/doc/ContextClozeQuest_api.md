# Context Cloze Quest: API

> Last verified: 2026-07-21. Base path: `/api/v1/fillInBlanks`.

The client reads the base URL from `VITE_API_URL` and defaults to `http://localhost:5000/api/v1`.

## Generate a puzzle

```http
GET /api/v1/fillInBlanks?storyId=STORY_ID&language=english&difficulty=easy&wordTypes=NOUN,VERB
```

### Query parameters

| Parameter | Required | Values/behavior |
| --- | --- | --- |
| `storyId` | Yes | MongoDB story ID selected by the player |
| `language` | No | `english` (default) or `sanskrit` |
| `difficulty` | No | `easy` (default), `medium`, or `hard` |
| `wordTypes` | No | Comma-separated POS tags; defaults to `NOUN` |

### Success: HTTP 200

```json
{
  "success": true,
  "data": {
    "id": "story-id",
    "originalParagraph": "The child walked through the garden.",
    "paragraph": "The _____ walked through the _____.",
    "answers": ["child", "garden"],
    "wordBank": ["garden", "river", "child", "teacher"]
  }
}
```

`answers` corresponds positionally to the `_____` markers in `paragraph`. `wordBank` contains answers and distractors in random order.

### Errors

```json
{
  "success": false,
  "message": "storyId is required"
}
```

- HTTP 400 when `storyId` is absent.
- HTTP 500 for story lookup or generation errors.

Note: the puzzle client currently looks for `data.error` rather than `data.message` when producing its thrown error, so the server's detailed message may not reach the UI.

## Submit a score

```http
POST /api/v1/fillInBlanks/score
Content-Type: application/json
```

### Request

```json
{
  "uuid": "firebase-user-id",
  "displayName": "Player",
  "score": 380,
  "bestTime": 20000,
  "storyId": "story-id",
  "difficulty": "easy"
}
```

`bestTime` is milliseconds elapsed. The route is currently unauthenticated and trusts these client-supplied fields.

### Success: HTTP 200

```json
{
  "success": true,
  "updated": true,
  "message": "Best score saved"
}
```

When the existing score is better, `updated` is false and the message is `Existing best score was kept`.

### Validation error: HTTP 400

```json
{
  "success": false,
  "message": "score must be a non-negative number"
}
```

## Read the leaderboard

```http
GET /api/v1/fillInBlanks/leaderboard?limit=10
```

`limit` defaults to 10 and is clamped to 1–100.

### Success: HTTP 200

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "uuid": "firebase-user-id",
      "displayName": "Player",
      "score": 380,
      "bestTime": 20000,
      "storyId": "story-id",
      "difficulty": "easy"
    }
  ]
}
```

Results are ordered by score descending and time ascending. This is a global leaderboard rather than a story/difficulty-filtered leaderboard.

## Contract-change checklist

When changing a route or field, update together:

1. Router, controller, service, and tests under `server/fillinblanks`.
2. `FillInTheBlankFrontendService.js` or `contextClozeQuestScoreApi.js`.
3. The consuming code in `ContextClozeQuest/index.jsx` or leaderboard service.
4. This API document and any affected gameplay documentation.

