# Context Cloze Quest Playwright E2E Tests

## Status

Verified locally on July 20, 2026:

```text
Client production build:                    GREEN
Context Cloze Quest focused Playwright:      26/26 passed
Combined explicit Playwright regression:    180/180 passed
Playwright browser:                          Chromium
Execution mode:                              sequential / one worker
Express backend required:                    No
MongoDB required:                            No
Firebase required:                           No
External story service required:             No
```

Milestone:

```text
GAME-E2E-02 — Context Cloze Quest: COMPLETE / GREEN
```

## Files

```text
client/
├── src/games/ContextClozeQuest/
│   ├── index.jsx
│   └── README.md
└── tests/
    ├── helpers/
    │   └── context-cloze-quest-fixtures.js
    ├── docs/
    │   └── README_CONTEXT_CLOZE_QUEST_e2e_TESTS.md
    └── context-cloze-quest.spec.js
```

## Testing methodology

Context Cloze Quest is rendered entirely inside a ZIMJS canvas. Normal Playwright DOM locators cannot inspect its menu controls, passage blanks, draggable words, timer, score, hints, feedback, or submitted state.

The suite therefore uses a gated development/E2E bridge in the existing game file.

The bridge:

- publishes current production state and live ZIM geometry;
- provides deterministic setup commands;
- dispatches the existing production drag and Submit handlers;
- calls the existing hint, Reset, and Menu functions;
- does not maintain a second copy of the gameplay rules;
- is removed when the GameScene unmounts.

All additions in the team-owned game file have adjacent comments explaining that they exist for E2E observability or control and do not change player-facing behavior.

## Deterministic fixtures

The helper intercepts only the real endpoints used by the game:

```text
GET  /api/v1/fillInBlanks
POST /api/v1/fillInBlanks/score
```

The application still uses its production frontend service functions and real request serialization.

Fixtures provide:

| Language | Easy | Medium | Hard |
|---|---:|---:|---:|
| English | 3 blanks | 6 blanks | 9 blanks |
| Sanskrit | 3 blanks | 6 blanks | 9 blanks |

Every board uses unique answers and deterministic distractors. This makes correct, partially correct, fully incorrect, replacement, and score assertions reproducible.

The helper records:

```text
game request method and URL
language
difficulty
wordTypes
storyId
score request method and URL
score POST body
```

## Authentication coverage

Two launch paths are provided:

```text
openContextClozeQuestAsGuest(...)
openContextClozeQuestAsSignedIn(...)
```

Both enter through:

```text
Login
Story Picker
Launcher
GameScene
ZIM holder
```

The signed-in path uses the existing E2E authentication bypass and the normal email sign-in UI.

Guest completion must not post a score. Signed-in completion must post exactly one score with the expected user, score, elapsed time, story, and difficulty.

## Focused test inventory

`client/tests/context-cloze-quest.spec.js` contains 26 tests.

### Menu and request contract

1. Opens with the real default menu state.
2. Uses real canvas menu controls for Sanskrit, multi-select word types, final-selection protection, hard difficulty, and launch.
3. Rejects invalid deterministic menu selections without changing the menu.
4. Sends English easy, selected story, and all requested word types.
5. Renders English medium with six blanks and the 90-second policy.
6. Renders Sanskrit hard with nine blanks and the 120-second policy.

### Canvas and placement behavior

7. Publishes usable live blank and word geometry.
8. Replaces an occupied blank and returns the earlier word home.
9. Moves one placed word between blanks and returns it home.
10. Clears every placement through the existing release path.

### Submission, hints, and scoring

11. Shows the incomplete-board warning without locking or posting.
12. Uses two distinct hints and refuses to spend a third.
13. Does not spend a hint when every blank is already correct.
14. Locks a fully incorrect submission with no perfect bonus.
15. Gives a partially correct filled board only its answer score.
16. Gives a perfect guest completion the exact remaining-time bonus without posting.
17. Subtracts the exact hint penalty from a perfect score.

### Timer and navigation

18. Reaches zero, stops the production timer, and publishes the derived timeout state.
19. Reset requests a fresh board and clears placements, hints, score, feedback, and lock state.
20. Menu abandons the board while preserving current selections.
21. Ignores a stale delayed response after returning to the menu.

### API, score, and lifecycle behavior

22. A failed game response never fabricates a gameplay board.
23. Signed-in perfect completion posts the exact score payload once.
24. Duplicate Submit events cannot post twice.
25. A failed score POST preserves the completed result and locked board.
26. Leaving GameScene removes the debug state and commands.

## Deterministic commands

The bridge exposes commands only while a live round exists:

```text
placeWordInBlankForTest
returnWordHomeForTest
clearPlacementsForTest
placeCorrectAnswersForTest
placeWrongAnswersForTest
useHintForTest
submitAnswerForTest
setRemainingTimeForTest
resetGameForTest
```

Placement commands dispatch the existing ZIM `mousedown` and `pressup` handlers. Submit dispatches the existing ZIM button click. Hint calls the existing `applyHint()`. Reset calls the existing `startGame()` path.

`setRemainingTimeForTest` is deterministic setup for timer and scoring assertions. The production interval remains responsible for countdown and timeout behavior.

## Current timeout contract

The focused suite verifies the current production behavior when time reaches zero:

```text
remainingTime: 0
timerRunning: false
timedOut: true
roundSubmitted: false
controlsLocked: false
```

The canvas displays the existing time-up feedback, but the round is not automatically submitted or locked. A player may continue and submit with zero remaining-time bonus.

The E2E bridge derives `timedOut` from existing production variables:

```text
remainingTime <= 0
round not submitted
timer interval stopped
```

This avoids making the browser test depend on a brittle read of a mutable ZIM label.

## Run the focused suite

From `client`:

```powershell
npm run test:e2e -- `
  tests/context-cloze-quest.spec.js `
  --workers=1
```

Expected:

```text
26 passed
```

Run one test:

```powershell
npm run test:e2e -- `
  tests/context-cloze-quest.spec.js `
  --grep "production countdown reaches zero" `
  --workers=1
```

## Run in a visible browser

```powershell
npm run test:e2e:headed -- `
  tests/context-cloze-quest.spec.js `
  --workers=1
```

## Run the combined verified regression

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
  --workers=1
```

Verified result:

```text
Non-game suite:                  134
Passage Reconstruction:          20
Context Cloze Quest:             26
------------------------------------
Combined regression:            180 passed
```

Never run a bare `npm run test:e2e` for milestone validation. Keep the spec inventory explicit.

## Production build

From `client`:

```powershell
npm run build
```

Verified result:

```text
Client production build: GREEN
```

The Vite large-chunk message is a warning and is not a failure of this game milestone.

## Repository validation

From the repository root:

```powershell
node --check `
  .\client\tests\helpers\context-cloze-quest-fixtures.js

node --check `
  .\client\tests\context-cloze-quest.spec.js

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

## Scope boundary

This milestone verifies the current Context Cloze Quest implementation. It does not change:

```text
menu rules
API behavior
drag rules
hint rules
timer rules
scoring formulas
score-submission policy
timeout submission/locking behavior
```

Meaning Bridge and Word Hunt remain the next gameplay suites to rebuild under the same canvas methodology.
