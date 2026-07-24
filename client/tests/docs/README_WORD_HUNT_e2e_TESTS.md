# Word Hunt Playwright E2E Tests

## Status

Verified locally on July 24, 2026:

```text
Client production build:                 GREEN
Word Hunt focused Playwright:             24/24 passed
Combined explicit Playwright regression: 231/231 passed
Playwright browser:                       Chromium
Execution mode:                           sequential / one worker
Express backend required:                 No
MongoDB required:                         No
Firebase required:                        No
External story service required:          No
```

Milestone:

```text
GAME-E2E-04 — Word Hunt: COMPLETE / GREEN
```

Word Hunt is the fourth gameplay suite completed under the project's
deterministic ZIMJS canvas Playwright methodology.

## Files

```text
client/
├── src/
│   └── games/WordHunt/
│       ├── Game.js
│       ├── index.jsx
│       ├── e2eTestBridge.js
│       ├── pages/
│       │   ├── FindAdjectiveGame.js
│       │   └── FindVerbGame.js
│       ├── UI/
│       │   └── Panel.js
│       └── utils/
│           └── GameManager.js
└── tests/
    ├── docs/
    │   └── README_WORD_HUNT_e2e_TESTS.md
    ├── helpers/
    │   └── word-hunt-fixtures.js
    └── word-hunt.spec.js
```

The verified GitHub Actions workflow is:

```text
.github/workflows/playwright-client-e2e.yml
```

## Testing methodology

Word Hunt is rendered inside a ZIMJS canvas. Normal Playwright DOM locators
cannot inspect its landing controls, passage words, POS classifications, score,
Hint state, timer, result panels, or internal navigation controls.

The suite therefore uses a gated development/E2E bridge:

```js
window.__wordHuntZimDebug
window.__wordHuntZimTestHooks
```

The bridge is enabled when at least one condition is true:

```text
import.meta.env.DEV
import.meta.env.VITE_E2E === "true"
localStorage.wordHuntE2E === "1"
```

The bridge:

- reads the existing production `Game` and active noun, verb, or adjective objects;
- publishes copied production state;
- publishes live ZIM passage-word and control geometry;
- exposes the actual rendered winning-message text;
- exposes only a read-only `getState()` hook;
- does not select words or dispatch game actions;
- does not maintain a second score, timer, queue, Hint counter, or persistence model;
- removes its browser globals when the shared `GameScene` unmounts.

Production-file E2E additions are marked by adjacent `E2E TEST` or
`E2E RESULT OBSERVABILITY` comments.

## Real canvas interaction

The helper converts live ZIM stage geometry into browser coordinates:

```text
ZIM word or control center
→ canvas bounding rectangle
→ scaled browser x/y coordinates
→ Playwright mouse click
→ existing ZIM tap callback
→ existing production gameplay path
```

The suite uses this path for:

```text
landing Start Adventure
language toggle
Back
Hint
Next
Continue
Restart
Exit
noun selection
verb selection
adjective selection
incorrect POS selections
```

The tests do not insert words into `foundWords`, change the score, expire timers
synthetically, or invoke an alternate gameplay implementation.

## Deterministic API fixtures

The Word Hunt fixture intercepts the real frontend endpoints:

```text
GET  /api/v1/storySets/active
GET  /api/v1/wordHunt/POSEnglish?storyId=...
GET  /api/v1/wordHunt/POSSanskrit?storyId=...
GET  /api/v1/wordHunt/playerData?...
POST /api/v1/wordHunt/addStoryInfo
POST /api/v1/wordHunt/addGameData
```

The frontend still uses:

```text
production Word Hunt service functions
production request serialization
selected Story Picker ID
real React authentication flow
real Story Picker and launcher navigation
real GameScene mounting
real ZIM rendering
real timers and control callbacks
real scoring and completion logic
```

The fixture records:

```text
English passage requests
Sanskrit passage requests
player-data requests
story-metadata writes
completed-game writes
request methods
query parameters
serialized request bodies
```

No live Express server, MongoDB database, Firebase service, production secret,
or external story service is required.

## Authentication and language coverage

The helper provides guest and signed-in launch paths.

Both paths enter through the real application sequence:

```text
Login
→ Story Picker
→ Launcher
→ shared GameScene
→ Word Hunt ZIM holder
→ Word Hunt landing page
```

Verified language and identity behavior includes:

```text
guest English gameplay
signed-in Sanskrit gameplay
selected Story Picker ID
active Story Set ID
signed-in player ID and display name
Sanskrit story-metadata persistence
Sanskrit noun completion persistence
Sanskrit adjective completion persistence
guest persistence suppression
```

## Focused test inventory

`client/tests/word-hunt.spec.js` contains 24 tests.

### Landing, loading, and shared lifecycle

1. The landing page exposes the selected story and real canvas controls.
2. The language toggle changes the production landing selection through a real canvas click.
3. English Start Adventure sends the selected story and builds the production game queue.
4. Gameplay publishes the live passage and real Back, Hint, and Next controls.
5. Shared GameScene Back unmounts Word Hunt and removes its E2E globals.

### Noun gameplay

6. A real noun click uses the production matching and scoring path.
7. An incorrect verb click preserves noun progress and emits production feedback.
8. Clicking an already-found noun cannot award duplicate progress or score.
9. Hint highlights unfound noun targets and restores them after expiry.
10. Completing every noun displays the real result controls.
11. Continue advances from the noun result to live verb gameplay.
12. Back returns from noun gameplay to the Word Hunt landing page.

### Timer and result controls

13. Real timer expiry displays the production Restart and Exit controls.
14. Restart begins a clean noun attempt after timeout.
15. Exit from the timeout result returns to the landing page.

### Sanskrit noun persistence

16. Signed-in Sanskrit play writes story metadata and completed noun data.

### Queue and verb gameplay

17. Next skips the noun round and starts unlocked verb gameplay.
18. Completing every verb displays its result and Continue starts adjective gameplay.
19. Verb Hint restores input after its production expiry.

### Adjective gameplay

20. A correct adjective awards the documented base score.
21. Incorrect verb selection during adjective gameplay shows orange feedback without a runtime error.
22. Completing every adjective displays the adjective result and Continue starts usable noun gameplay.
23. Adjective Hint restores input after its production expiry.
24. Signed-in Sanskrit adjective completion writes complete score and Hint metadata.

## Current gameplay contracts verified

### Production queue

When all supported POS categories exist:

```text
Noun
→ Verb
→ Adjective
```

The internal Next control may skip the current round and advance through the
same production queue.

After adjective completion, Continue begins a new noun round.

### Correct-word scoring

```text
base points per correct word: 10
Hint penalty per correct word: 0.25 per used Hint
minimum points per correct word: 0.25
duplicate found word: no additional score
```

Examples verified by the browser suite:

```text
correct noun without Hint:          10
correct adjective without Hint:     10
correct word after one Hint:         9.75
four completed adjectives:         40
two completed Sanskrit adjectives: 20
```

### Completion multiplier fixture

For the signed-in Sanskrit adjective completion fixture:

```text
base adjective score:             20
no-Hint elite multiplier:        ×10
persisted total score:           200
persisted coins:                  20
persisted hintsUsed:               0
persisted foundWords:              2
persisted gameInstance:    Adjective
```

This verifies the production multiplier and persistence path without
duplicating either formula in the test implementation.

### Hint lifecycle

The noun, verb, and adjective Hint controls use the production panel and timer.

Verified behavior:

```text
Hint opens
target words are highlighted
input is temporarily locked where required
Hint counter increments
Hint expires through the production timeout
unfound targets return to their normal color
already-found words retain their found color
input becomes usable again
```

### Result messaging

The suite reads the real rendered ZIM winning label.

Verified messages identify the completed challenge correctly:

```text
Noun result → Noun
Verb result → Verb
Adjective result → Adjective
```

### Timeout behavior

The timer-expiry suite uses the real production `Timer`.

Verified state:

```text
round game-over: true
timer active: false
input locked: true
time-up message attached: true
Restart attached and usable: true
Exit attached and usable: true
```

### Cleanup behavior

When the shared GameScene Back control unmounts Word Hunt:

```text
Word Hunt holder removed
launcher restored
window.__wordHuntZimDebug removed
window.__wordHuntZimTestHooks removed
```

The bridge is not removed during normal noun-to-verb-to-adjective transitions
because the production game also uses internal cleanup during those transitions.

## Production defects verified and repaired

The focused suite demonstrated several player-facing defects before their
repairs:

```text
Verb Hint expiry left passage input locked.
Adjective Hint expiry left passage input locked.
Adjective scoring was not dispatched by the shared score manager.
Incorrect verb selection in adjective gameplay called setcolor() and threw.
Adjective completion used noun-count defaults for multiplier calculation.
Adjective Hint persistence used inconsistent state-field names.
Adjective completion displayed Noun in its winning message.
```

Each repair was limited to the demonstrated behavior. The tests retained their
assertions and passed only after the production behavior was corrected.

The milestone did not redesign:

```text
POS classification
game queue order
timer durations
base score
Hint penalty
score multiplier formula
coin formula
API endpoints
persistence eligibility
language selection
landing layout
result controls
```

## Run the focused suite

From `client`:

```powershell
npm run test:e2e -- `
  tests/word-hunt.spec.js `
  --workers=1
```

Verified result:

```text
Word Hunt focused Playwright: 24/24 passed
```

Run one test:

```powershell
npm run test:e2e -- `
  tests/word-hunt.spec.js `
  --grep "signed-in Sanskrit adjective completion" `
  --workers=1
```

## Run in a visible browser

```powershell
npm run test:e2e:headed -- `
  tests/word-hunt.spec.js `
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
  tests/word-hunt.spec.js `
  --workers=1
```

Verified result:

```text
Non-game suite:                  134
Passage Reconstruction:          20
Context Cloze Quest:             26
Meaning Bridge:                  27
Word Hunt:                       24
------------------------------------
Complete explicit regression:   231 passed
```

Never use bare:

```powershell
npm run test:e2e
```

Milestone and release validation must keep the spec inventory explicit so
team-owned, retired, experimental, or incomplete tests cannot join the gate
accidentally.

## Production build

From `client`:

```powershell
npm run build
```

Verified result:

```text
Client production build: GREEN
```

The Vite large-chunk message is a warning and is not a Word Hunt milestone
failure.

## Repository validation

From the repository root:

```powershell
node --check `
  .\client\src\games\WordHunt\e2eTestBridge.js

node --check `
  .\client\src\games\WordHunt\Game.js

node --check `
  .\client\src\games\WordHunt\pages\FindVerbGame.js

node --check `
  .\client\src\games\WordHunt\pages\FindAdjectiveGame.js

node --check `
  .\client\src\games\WordHunt\utils\GameManager.js

node --check `
  .\client\tests\helpers\word-hunt-fixtures.js

node --check `
  .\client\tests\word-hunt.spec.js

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
unrelated pre-existing modifications
```

## CI registration

The verified client workflow explicitly includes:

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
tests/word-hunt.spec.js
```

The job builds the production client and runs all 231 verified Chromium tests
with one worker.

## Scope boundary

This milestone validates the current Word Hunt implementation through real
browser and canvas behavior.

Production source modifications consist of:

```text
gated E2E state observability
live canvas geometry publication
E2E-global cleanup on GameScene unmount
retained references to existing controls
narrow production repairs proven by failing tests
adjacent explanatory comments
```

The E2E bridge is not a second implementation of Word Hunt.

## Closeout

```text
NON-GAME-E2E:                         COMPLETE / GREEN
GAME-E2E-01 — Passage Reconstruction: COMPLETE / GREEN
GAME-E2E-02 — Context Cloze Quest:     COMPLETE / GREEN
GAME-E2E-03 — Meaning Bridge:          COMPLETE / GREEN
GAME-E2E-04 — Word Hunt:               COMPLETE / GREEN

Client production build:              GREEN
Complete explicit Playwright suite:   231/231 passed
```
