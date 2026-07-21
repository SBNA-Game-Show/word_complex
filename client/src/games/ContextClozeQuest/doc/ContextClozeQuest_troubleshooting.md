# Context Cloze Quest: Troubleshooting

> Last verified: 2026-07-21.

## Quick diagnosis

| Symptom | Likely cause | What to check |
| --- | --- | --- |
| Gameplay screen is mostly empty | Puzzle request failed; the game has no visible fetch-error state | Browser Network tab and console; backend terminal |
| HTTP 400 `storyId is required` | No active story was selected or session state was cleared | Story picker and `activeStory.js` |
| HTTP 500 when starting | Story ID is invalid, Atlas is unavailable, or expected story fields are missing | Response body, server logs, `ATLAS_URI`, story schema |
| English works but Sanskrit fails | Missing/malformed Sanskrit passage or token fields | `sanskritVersion`, `tokenized_sanskrit_version` |
| Too few blanks | Not enough unique tokens match the selected POS tags | Token `text`, `pos`/`upos`, selected types |
| A blank appears in the wrong place | Literal string replacement matched an unexpected occurrence/substring | `createFillInBlankGame()` and source passage casing/repetition |
| Dragged word jumps | Parent changed without coordinate conversion | `localToGlobal()` / `globalToLocal()` in drag handlers |
| Hint character does not react | Scene event listener/configuration mismatch | `sceneBus`, `sceneConfig.js`, emitted game ID/event |
| Score is not saved | User is a guest, request failed, or input/database validation failed | `authUser`, Network tab, browser/server logs |
| Worse result remains on leaderboard | Expected behavior: only a better score or equal score with faster time replaces it | Stored `bestScore` and `bestTime` |
| Score appears under unexpected difficulty | One global record per UUID was replaced by that attempt | `context_cloze_quest` collection design |
| Timer reaches zero but controls still work | Current implementation does not lock on timeout | Timer callback in `index.jsx` |

## Puzzle request checklist

1. Confirm the client requests the expected `VITE_API_URL`.
2. Confirm the URL includes `/api/v1/fillInBlanks`.
3. Confirm `storyId`, `language`, `difficulty`, and `wordTypes` appear in the query.
4. Call the route directly or inspect its JSON response.
5. Confirm MongoDB connectivity and Atlas network access in server logs.
6. Inspect the selected story's language fields and flattened token data.

## Data problems

Eligible tokens require:

```json
{
  "text": "garden",
  "pos": "NOUN"
}
```

`upos` can be used instead of `pos`. Text must be a string containing a Unicode letter or mark. POS matching is exact and case-sensitive. If the selected type is `ADJ` but the dataset uses another label, adjectives will not be selected.

If the story contains repeated answer text, the current algorithm operates on the first string occurrence. If a short answer is a substring of another word, literal replacement may produce an unintended blank. Prefer fixing the algorithm with token offsets and tests instead of patching individual story text.

## Score problems

The browser logs either `Context Cloze Quest score result` or `Could not save Context Cloze Quest score`. Inspect the POST response from `/fillInBlanks/score`.

Validation accepts only a string UUID and finite non-negative numeric score/time. JSON strings such as `"380"` are not accepted as numbers. A successful response with `updated: false` is not an error; it means the stored result was better.

Because the route currently trusts client input and has no authentication middleware, suspicious leaderboard values may be direct API submissions. See the backend security section before treating the leaderboard as authoritative.

## Canvas and lifecycle problems

- Verify new UI code runs inside the ZIM `setup()` callback.
- Call `stage.update()` after changing ZIM visuals.
- Clear new intervals/timeouts on reset, menu navigation, and unmount.
- Guard async completions with `disposed` and the captured `gameRunId`.
- Remove event listeners or use objects cleaned up by the frame lifecycle.
- Preserve button coordinate conversion when re-parenting between `stage` and `passageContent`.

React Strict Mode may mount, clean up, and mount again in development. `createZimGame` already protects frame creation; new code must not assume setup callbacks live forever.

## Escalating an unresolved issue

Record enough detail for another student to reproduce it:

- Selected story ID, language, word types, and difficulty.
- Exact steps and expected/actual results.
- Browser and backend console errors.
- Request URL, status code, and sanitized response body.
- Whether the user was guest or authenticated.
- Relevant story shape with private information removed.
- Commit/branch and whether the issue reproduces after a clean restart.

Do not include tokens, MongoDB URIs, Firebase credentials, or personal user information.

