# Meaning Bridge Playwright E2E Tests

## Status

Verified locally on July 23, 2026:

```text
Client production build:                 GREEN
Meaning Bridge focused Playwright:        27/27 passed
Combined explicit Playwright regression: 207/207 passed
Playwright browser:                       Chromium
Execution mode:                           sequential / one worker
Express backend required:                 No
MongoDB required:                         No
Firebase required:                        No
External story service required:          No
```

Milestone:

```text
GAME-E2E-03 — Meaning Bridge: COMPLETE / GREEN
```

Meaning Bridge is the third gameplay suite completed under the project's deterministic ZIMJS canvas Playwright methodology.

## Files

```text
client/
├── src/
│   ├── games/MeaningBridge/
│   │   └── index.jsx
│   └── services/
│       └── meaningBridgeApi.js
└── tests/
    ├── docs/
    │   └── README_MEANING_BRIDGE_e2e_TESTS.md
    ├── helpers/
    │   └── meaning-bridge-fixtures.js
    └── meaning-bridge.spec.js
```

The verified GitHub Actions workflow is:

```text
.github/workflows/playwright-client-e2e.yml
```

## Testing methodology

Meaning Bridge is rendered inside a ZIMJS canvas. Normal Playwright DOM locators cannot inspect its challenge cards, timer, matches, hints, score, feedback, round summaries, leaderboard, or final-score screen.

The suite therefore uses a gated development/E2E bridge in the existing game file.

The bridge is available when at least one of these conditions is true:

```text
import.meta.env.DEV
import.meta.env.VITE_E2E === "true"
localStorage.meaningBridgeE2E === "1"
```

The bridge:

- publishes current production state;
- publishes live left-card and right-card ZIM geometry;
- exposes selected cards, matches, score, hints, misses, timer state, round state, submission state, and leaderboard state;
- provides deterministic setup commands that call existing game functions;
- permits Playwright to perform real browser mouse clicks against live canvas-card centers;
- does not maintain a second copy of matching, scoring, progression, submission, or leaderboard rules;
- removes its debug state, commands, and keyboard cleanup state when GameScene unmounts.

The production-file additions are marked with adjacent `E2E TEST` comments and do not change player-facing behavior.

## Real canvas coverage

The helper converts stage-space coordinates into browser-space coordinates:

```text
ZIM card center
→ canvas bounding box
→ browser x/y position
→ Playwright mouse click
→ existing onCardClick()
→ existing checkPair()
→ production match, score, and progression logic
```

Both correct and incorrect match tests use this real canvas path.

The click helper verifies that each browser click registered. It retries once only when the published state proves that a freshly re-rendered ZIM card did not receive the click. It never inserts a match directly.

## Deterministic API fixtures

The helper intercepts only the real endpoints used by `meaningBridgeApi.js`:

```text
POST /api/v1/meaningBridge/generate
POST /api/v1/meaningBridge/submit
POST /api/v1/meaningBridge/score
GET  /api/v1/meaningBridge/score/leaderboard?limit=10
GET  /api/v1/meaningBridge/leaderboard?limit=10
```

The application still uses:

```text
production frontend service functions
production request serialization
selected Story Picker ID
real React navigation
real GameScene mounting
real ZIM rendering
real keyboard handlers
real matching and score state
```

Fixtures provide deterministic Synonym, Definition, and Antonym puzzles for the production pair-count sequence:

```text
Round 1: 4 pairs
Round 2: 5 pairs
Round 3: 6 pairs
```

The helper can configure:

```text
success responses
HTTP failures
delayed generation
ordered response-status sequences
persistent-score success or failure
persistent leaderboard success or failure
fallback leaderboard success or failure
custom leaderboard rows
```

It records:

```text
generation requests
round-submission requests
persistent best-score requests
persistent leaderboard requests
fallback leaderboard requests
```

## Request contracts

### Generate a round

```json
{
  "mode": "word-to-synonym",
  "pairCount": 4,
  "storyId": "playwright-story-1"
}
```

Supported deterministic modes:

```text
word-to-synonym
word-to-definition
word-to-antonym
```

### Submit one completed round

```json
{
  "roundId": "word-to-synonym-4-round-1",
  "playerName": "E2E Reader",
  "matches": [
    {
      "leftId": "left_0",
      "rightId": "right_0"
    }
  ],
  "timeSeconds": 20,
  "hintsUsed": 1,
  "wrongAttempts": 1,
  "pairCount": 4
}
```

### Persist a signed-in player's best session

```json
{
  "uuid": "meaning-reader-1",
  "playerName": "Mira Meaning",
  "score": 70,
  "timeSeconds": 30,
  "accuracy": 100
}
```

Guest sessions submit completed rounds to the session scoring endpoint but do not call the persistent best-score endpoint.

## Server-result fixture

The deterministic round-submit fixture mirrors the current server formula:

```text
correct matches:        matches.length
base score:             max(0, correct × 10 − hints × 2 − misses × 5)
speed bonus:            round(max(0, 90 − timeSeconds) × 0.5)
authoritative score:    base score + speed bonus
server accuracy:        correct / (correct + misses)
```

The browser suite verifies the server-returned score separately from the live client score.

The current client result-strip accuracy includes hint use:

```text
correct / (correct + misses + hints)
```

The tests document both current contracts without changing either formula.

## Authentication coverage

The helper provides two complete application launch paths:

```text
openMeaningBridgeAsGuest(...)
openMeaningBridgeAsSignedIn(...)
```

Both enter through the real application sequence:

```text
Login
→ Story Picker
→ Launcher
→ GameScene
→ ZIM holder
→ Meaning Bridge landing screen
```

The signed-in path uses the existing E2E authentication bypass and normal email sign-in UI.

Verified behavior:

```text
Guest display name:          E2E Reader
Guest identity type:         Guest
Signed-in display name:      Mira Meaning
Signed-in identity type:     Signed in
Guest persistent save:       not requested
Signed-in persistent save:   requested once
```

## Focused test inventory

`client/tests/meaning-bridge.spec.js` contains 27 tests.

### Landing, modes, and request contracts

1. Opens at the production landing screen with the gated E2E state bridge.
2. Starts Synonym Practice through the production round API.
3. Starts Definition Practice through the production round API.
4. Starts Antonym Practice through the production round API.
5. Starts a five-minute Timed Challenge and preserves the selected timer.
6. Clamps custom timer input to the production 1-to-60-minute limits.

### Canvas geometry and matching

7. Publishes usable live geometry for four cards on both sides.
8. Performs a real correct canvas match through production click and scoring logic.
9. Applies the production wrong-match penalty and preserves the selected word.
10. Counts a selected-word hint once and does not charge an unselected hint.
11. Completes a four-pair round through real canvas clicks and publishes its result summary.
12. Progresses through the production 4-to-5-to-6 pair sequence.

### Submission and persistence

13. Submits a completed guest round using the authoritative server result without persistent storage.
14. Persists the authoritative completed-session result for a signed-in player.
15. Keeps a successful round submission when signed-in best-score persistence fails.
16. Does not submit an already-saved round twice.
17. Surfaces a round-submission failure without marking the round submitted.

### Leaderboards

18. Loads the persistent Meaning Bridge leaderboard without using the fallback.
19. Falls back to the session leaderboard when the persistent leaderboard fails.
20. Publishes an error when both leaderboard sources fail.

### Loading, keyboard, timer, exit, and cleanup

21. Publishes loading while the production round request is pending.
22. Shows a generation error and retries through keyboard `R`.
23. Uses keyboard `H` for hints and keyboard `R` to retry the active puzzle.
24. Uses keyboard `S` to skip to the next production pair-count round.
25. Uses keyboard `Escape` for exit confirmation; cancellation preserves progress and confirmation resets the session.
26. Expires a real timed round through the production interval and advances to round two.
27. Removes Meaning Bridge globals and keyboard cleanup state when GameScene unmounts.

## Current gameplay contracts verified

### Challenge types

```text
Synonym Bridge
Definition Bridge
Opposite Bridge / Antonyms
```

### Session structure

```text
3 rounds
4 pairs → 5 pairs → 6 pairs
```

### Play modes

```text
Practice
Timed Challenge
```

Timer choices:

```text
2 minutes
5 minutes
10 minutes
custom 1–60 minutes
```

### Live client scoring

```text
correct match:          +10
wrong attempt:          −5
score floor:             0
repeat hint same word:   no second hint count
```

A wrong match leaves the selected left card active so the player may try another right card.

### Timed expiry

The timer test loads the timed round with normal browser timers, then moves `Date.now()` beyond the active deadline with Playwright's fixed-time control.

The already-running production interval remains responsible for:

```text
calculating timedSecondsLeft
detecting zero
stopping the current interval
snapshotting the current round
advancing through handleRoundTimeout()
loading the next pair-count round
starting the next round timer
```

The test does not call the old synthetic expiry hook and does not reproduce timeout progression in the spec.

### Exit behavior

During gameplay:

```text
Escape → confirmation screen
Cancel → restore gameplay and preserve score/matches
Confirm → reset session and return to landing
```

### Submission behavior

```text
completed rounds are submitted once
submitted round IDs prevent duplicate POSTs
guest sessions skip persistent best-score storage
signed-in sessions persist the authoritative session result
persistent-save failure is nonfatal after round submission succeeds
round-submit failure remains retryable and is not marked submitted
```

### Leaderboard fallback

```text
persistent leaderboard success → use persistent rows
persistent leaderboard failure → request session fallback
both endpoints fail → publish original persistent error
```

## Deterministic commands

The gated bridge currently exposes:

```text
getState
goToLandingForTest
goToChallengeForTest
chooseChallengeForTest
setPracticeForTest
setTimedForTest
setCustomTimerMinutesForTest
startPracticeForTest
startTimedForTest
selectFirstLeftCardForTest
requestHintForTest
getFirstHintForTest
completeCurrentPuzzleForTest
advanceAfterRoundCompleteForTest
finishPracticeForTest
submitScoreForTest
openLeaderboardForTest
requestExitForTest
cancelExitForTest
confirmExitForTest
expireTimerForTest
resetForTest
```

The focused suite prefers real browser interaction where the behavior under test is matching or keyboard routing.

Synthetic completion is used only in submission-focused tests after the real canvas suite has already verified production matching and round completion.

## Run the focused suite

From `client`:

```powershell
npm run test:e2e -- `
  tests/meaning-bridge.spec.js `
  --workers=1
```

Verified result:

```text
Meaning Bridge focused Playwright: 27/27 passed
```

Run one test:

```powershell
npm run test:e2e -- `
  tests/meaning-bridge.spec.js `
  --grep "expires a real timed round" `
  --workers=1
```

## Run in a visible browser

```powershell
npm run test:e2e:headed -- `
  tests/meaning-bridge.spec.js `
  --workers=1
```

## Run the complete explicit regression

From `client`:

```powershell
npm run test:e2e -- `
  tests/auth.spec.js `
  tests/site-navigation.spec.js `
  tests/platform-pages.spec.js `
  tests/progress-and-character.spec.js `
  tests/leaderboard.spec.js `
  tests/admin.spec.js `
  tests/tokenized-editor.spec.js `
  tests/passage-reconstruction.spec.js `
  tests/context-cloze-quest.spec.js `
  tests/meaning-bridge.spec.js `
  --workers=1
```

Verified result:

```text
Non-game suite:                  134
Passage Reconstruction:          20
Context Cloze Quest:             26
Meaning Bridge:                  27
------------------------------------
Complete explicit regression:   207 passed
```

Never use bare:

```powershell
npm run test:e2e
```

Milestone and release validation must keep the spec inventory explicit so team-owned, retired, experimental, or incomplete tests cannot join the gate accidentally.

## Production build

From `client`:

```powershell
npm run build
```

Verified result:

```text
Client production build: GREEN
```

The Vite large-chunk message is a warning and is not a Meaning Bridge milestone failure.

## Repository validation

From the repository root:

```powershell
node --check `
  .\client\tests\helpers\meaning-bridge-fixtures.js

node --check `
  .\client\tests\meaning-bridge.spec.js

git diff --check
git status --short
git diff --name-status
git diff --stat
```

Do not stage:

```text
client/playwright-report/
client/test-results/
client/dist/
node_modules/
.env files
source dumps
```

## CI registration

The explicit client workflow includes:

```text
tests/auth.spec.js
tests/site-navigation.spec.js
tests/platform-pages.spec.js
tests/progress-and-character.spec.js
tests/leaderboard.spec.js
tests/admin.spec.js
tests/tokenized-editor.spec.js
tests/passage-reconstruction.spec.js
tests/context-cloze-quest.spec.js
tests/meaning-bridge.spec.js
```

The job builds the client and runs all 207 verified Chromium tests with one worker.

Word Hunt remains excluded until its focused suite, combined regression, production build, documentation closeout, and review are GREEN.

## Scope boundary

This milestone verifies the current Meaning Bridge implementation. It does not change:

```text
challenge definitions
Practice or Timed mode rules
timer durations
round progression
matching rules
hint accounting
wrong-attempt penalties
client score formula
server score formula
submission policy
persistent best-score policy
leaderboard fallback policy
exit behavior
keyboard behavior
player-facing wording or layout
```

The only production-file changes are gated E2E observability, live canvas geometry publication, comments, and cleanup of E2E globals.

## Closeout

```text
GAME-E2E-01 — Passage Reconstruction: COMPLETE / GREEN
GAME-E2E-02 — Context Cloze Quest:     COMPLETE / GREEN
GAME-E2E-03 — Meaning Bridge:          COMPLETE / GREEN
GAME-E2E-04 — Word Hunt:               NEXT
```
