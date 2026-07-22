# Passage Reconstruction Playwright E2E Tests

## Status

Verified locally on July 20, 2026:

```text
Client production build:                 GREEN
Passage Reconstruction gameplay tests:   20 passed
Verified non-game Playwright tests:      134 passed
Combined verified regression:            154 passed
Playwright browser:                      Chromium
Execution mode:                          sequential / one worker
Backend required for E2E:                No
Live MongoDB required for E2E:           No
Live Firebase required for E2E:          No
External story service required:         No
```

Passage Reconstruction is the first gameplay suite rebuilt with the project's deterministic ZIMJS canvas testing methodology.

## Files

```text
client/
├── src/games/PassageReconstruction/
│   └── index.jsx
└── tests/
    ├── docs/
    │   └── README_PASSAGE_RECONSTRUCTION_e2e_TESTS.md
    ├── helpers/
    │   └── passage-reconstruction-fixtures.js
    └── passage-reconstruction.spec.js
```

## Why the game needs an E2E bridge

Passage Reconstruction is rendered inside a ZIMJS canvas. Normal DOM locators cannot reliably inspect its internal language buttons, phrase clouds, numbered slots, Check, Reset, Hint, feedback, or results screens.

The production game exposes:

```js
window.__passageReconstructionZimDebug
window.__passageReconstructionZimTestHooks
```

The bridge is available only when at least one condition is true:

```text
import.meta.env.DEV
import.meta.env.VITE_E2E === "true"
localStorage.passageReconstructionE2E === "1"
```

The Playwright configuration starts Vite with `VITE_E2E=true`.

The bridge does not replace game rules. Test commands arrange live ZIM objects and call the same production scoring, hint, checking, timer, result, and submission functions used by the game.

Both globals are deleted when the game unmounts.

## Observable state

The bridge publishes:

```text
screen and message
language
round index, number, and count
score
attempts
checks and correct checks
hints remaining and used
last hint text
time remaining and pause state
feedback and game-over state
current sentence, chunks, and answer
placed chunks
tile and zone geometry
final result summary
```

The final result summary contains:

```text
timedOut
timeBonus
finalScore
roundsRight
roundsWrong
accuracy
```

## Deterministic API fixtures

The suite runs the Vite client without Express or MongoDB. It intercepts the real service paths:

```text
GET  /api/v1/passageReconstruct/game
POST /api/v1/passageReconstruct/score
```

The game endpoint returns three deterministic English rounds or three deterministic Sanskrit rounds. Every phrase is unique within its round so placement, hint, Reset, correct-answer, and wrong-answer checks cannot be confused by duplicate text.

The fixture records:

```text
request method
requested language
selected storyId
score-submission body
game request count
score request count
```

Loading and failure behavior still travel through the game's real fetch and rendering paths.

## Real canvas drag

Most tests use the E2E bridge for deterministic board setup. One test performs a real mouse drag against the live canvas.

The helper reads published phrase and slot geometry, maps the internal 1100 x 720 coordinates to the rendered canvas, and uses Playwright's mouse API to drag a phrase into a numbered slot.

The test then verifies that the production pointer and snap logic assigned the phrase to the expected zone.

## Coverage

The 20 tests cover:

1. Initial language picker and bridge.
2. English loading.
3. Sanskrit loading.
4. Selected story ID propagation.
5. Memorisation preview.
6. Timer pause during preview.
7. Timer resume during gameplay.
8. Load failure.
9. Phrase and slot geometry.
10. Real canvas drag and snap.
11. Incomplete-board validation.
12. Reset clearing placed phrases.
13. Reset preserving a spent hint.
14. Two distinct hints.
15. Hint exhaustion.
16. No hint spent when all slots are correct.
17. Wrong-answer attempt loss.
18. Score floor at zero.
19. Exact 20-point wrong penalty after points are earned.
20. Three failed checks reaching round-over.
21. Retry restoring attempts.
22. Correct-answer scoring.
23. Next-round attempt and hint reset.
24. Whole-game timeout.
25. Missed-round accounting.
26. Natural completion.
27. Time-bonus calculation.
28. Guest score-submission exclusion.
29. Signed-in score payload.
30. Failed score request preserving results.
31. Play Again reset.
32. Hook cleanup after leaving GameScene.

Multiple behaviors are combined in individual cases, producing 20 tests while covering the 32 verification points above.

## Real application path

The tests enter the game through:

```text
authentication
→ Story Picker
→ launcher
→ Passage Reconstruction card
→ GameScene
→ ZIM canvas
```

The suite uses the real service, language selection, preview, renderer, Check, Reset, hint policy, countdown policy, feedback, round progression, result calculation, Play Again, score service, and teardown paths.

Only authentication outcomes and external API responses are deterministic.

## Guest and signed-in rules

Guest sessions must never submit scores.

Signed-in sessions submit once with:

```text
uuid
displayName
score
elapsed time in milliseconds
hintsUsed
selected storyId
```

The exact request body is verified. A failed score request must leave the completed results screen intact.

## Focused command

From `client`:

```powershell
npm run test:e2e -- `
  tests/passage-reconstruction.spec.js `
  --workers=1
```

Expected:

```text
20 passed
```

## Combined verified regression

Do not use bare `npm run test:e2e`, because Playwright may discover team-owned tests under `client/tests/admin/`.

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
  --workers=1
```

Expected:

```text
154 passed
```

## Build validation

```powershell
npm run build
```

Expected:

```text
Client production build: GREEN
```

A Vite chunk-size warning is not a build failure.

## Repository validation

From the repository root:

```powershell
git diff --check
git status --short
git diff --stat
git diff --name-status
```

## CI integration

The reusable workflow remains the verified 134-test non-game gate while the four gameplay suites are rebuilt.

All four game specs should be added to CI together after Passage Reconstruction, Context Cloze Quest, Meaning Bridge, and Word Hunt are complete.

## Milestone result

```text
GAME-E2E-01 — Passage Reconstruction: COMPLETE / GREEN
Focused gameplay suite:                  20/20 passed
Combined verified regression:            154/154 passed
Client production build:                 GREEN
```

Next:

```text
GAME-E2E-02 — Context Cloze Quest
```
