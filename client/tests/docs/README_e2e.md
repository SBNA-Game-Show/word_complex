# Word Complex Playwright E2E Tests

## Status

Verified locally on July 24, 2026:

```text
Client production build:                    GREEN
Non-game Playwright tests:                   134/134 passed
Passage Reconstruction focused Playwright:    20/20 passed
Context Cloze Quest focused Playwright:        26/26 passed
Meaning Bridge focused Playwright:             27/27 passed
Word Hunt focused Playwright:                   24/24 passed
Complete explicit Playwright regression:     231/231 passed
Playwright browser:                           Chromium
Execution mode:                               sequential / one worker
Express backend required:                     No
MongoDB required:                             No
Firebase required:                            No
External story service required:              No
```

Milestones:

```text
NON-GAME-E2E:                         COMPLETE / GREEN
GAME-E2E-01 — Passage Reconstruction: COMPLETE / GREEN
GAME-E2E-02 — Context Cloze Quest:     COMPLETE / GREEN
GAME-E2E-03 — Meaning Bridge:          COMPLETE / GREEN
GAME-E2E-04 — Word Hunt:               COMPLETE / GREEN
```

The verified client suite covers authentication, the player-facing platform shell,
progress features, leaderboards, Admin, Story Set management, the Tokenized Story
Editor, and four completed ZIMJS canvas games. External APIs are intercepted with
deterministic Playwright route mocks while the real frontend services, request
serialization, React navigation, GameScene mounting, ZIM rendering, and game
handlers remain active.

## Test inventory

### Non-game inventory

| Spec                             | Tests | Primary scope                                                                           |
| -------------------------------- | ----: | --------------------------------------------------------------------------------------- |
| `auth.spec.js`                   |     9 | Email, Google, guest, sign-up, errors, pending state, and logout                        |
| `site-navigation.spec.js`        |    18 | Story Picker, launcher, four shared game scenes, logout, and canvas zoom                |
| `platform-pages.spec.js`         |    15 | About and all four How-to-Play flows                                                    |
| `progress-and-character.spec.js` |    13 | Rewards, streak toast, character selection, purchases, and GameScene propagation        |
| `leaderboard.spec.js`            |    13 | Board switching, loading, errors, ranking, formatting, and refresh                      |
| `admin.spec.js`                  |    34 | Sources, downloads, metadata, uploads, tokenized stories, Story Sets, and failure paths |
| `tokenized-editor.spec.js`       |    32 | Loading, filtering, editing, save/discard, and English and Sanskrit tokens              |
| **Non-game total**               | **134** | **Completed non-game Playwright milestone**                                           |

### Verified gameplay inventory

| Spec                                 | Tests | Primary scope                                                                                              |
| ------------------------------------ | ----: | ---------------------------------------------------------------------------------------------------------- |
| `passage-reconstruction.spec.js`     |    20 | Canvas rounds, drag/order behavior, hints, scoring, timer, API, results, reset, stale responses, and cleanup |
| `context-cloze-quest.spec.js`        |    26 | Menu, languages, placement, hints, scoring, timer, API, score posting, reset, stale responses, and cleanup  |
| `meaning-bridge.spec.js`             |    27 | Modes, real canvas matches, progression, hints, penalties, scoring, persistence, leaderboards, keyboard, timer, exit, and cleanup |
| `word-hunt.spec.js`                  |    24 | Landing, language, live canvas words and controls, POS matching, hints, timer, queue, scoring, results, persistence, navigation, and cleanup |
| **Gameplay total**                   | **97** | **Four completed ZIMJS canvas-game milestones**                                                         |

### Complete verified inventory

```text
Non-game suite:                  134
Passage Reconstruction:          20
Context Cloze Quest:             26
Meaning Bridge:                  27
Word Hunt:                       24
------------------------------------
Complete explicit regression:   231
```

## Files

```text
client/tests/
├── docs/
│   ├── README_e2e.md
│   ├── README_PASSAGE_RECONSTRUCTION_e2e_TESTS.md
│   ├── README_CONTEXT_CLOZE_QUEST_e2e_TESTS.md
│   ├── README_MEANING_BRIDGE_e2e_TESTS.md
│   └── README_WORD_HUNT_e2e_TESTS.md
├── helpers/
│   ├── admin-fixtures.js
│   ├── app-fixtures.js
│   ├── passage-reconstruction-fixtures.js
│   ├── context-cloze-quest-fixtures.js
│   ├── meaning-bridge-fixtures.js
│   └── word-hunt-fixtures.js
├── admin.spec.js
├── auth.spec.js
├── leaderboard.spec.js
├── platform-pages.spec.js
├── progress-and-character.spec.js
├── site-navigation.spec.js
├── tokenized-editor.spec.js
├── passage-reconstruction.spec.js
├── context-cloze-quest.spec.js
├── meaning-bridge.spec.js
└── word-hunt.spec.js
```

GitHub Actions workflow:

```text
.github/workflows/playwright-client-e2e.yml
```

## Install

From `client`:

```powershell
npm ci
npx playwright install chromium
```

For Linux CI, Playwright also installs operating-system dependencies:

```bash
npx playwright install --with-deps chromium
```

## Run the completed non-game suite

From `client` in PowerShell:

```powershell
npm run test:e2e -- `
  tests/auth.spec.js `
  tests/site-navigation.spec.js `
  tests/platform-pages.spec.js `
  tests/progress-and-character.spec.js `
  tests/leaderboard.spec.js `
  tests/admin.spec.js `
  tests/tokenized-editor.spec.js `
  --workers=1
```

Expected:

```text
Non-game Playwright suite: 134 passed
```

Bash:

```bash
npm run test:e2e -- \
  tests/auth.spec.js \
  tests/site-navigation.spec.js \
  tests/platform-pages.spec.js \
  tests/progress-and-character.spec.js \
  tests/leaderboard.spec.js \
  tests/admin.spec.js \
  tests/tokenized-editor.spec.js \
  --workers=1
```

## Run the verified gameplay suites

### Passage Reconstruction

```powershell
npm run test:e2e -- `
  tests/passage-reconstruction.spec.js `
  --workers=1
```

Expected:

```text
20 passed
```

### Context Cloze Quest

```powershell
npm run test:e2e -- `
  tests/context-cloze-quest.spec.js `
  --workers=1
```

Expected:

```text
26 passed
```

### Meaning Bridge

```powershell
npm run test:e2e -- `
  tests/meaning-bridge.spec.js `
  --workers=1
```

Expected:

```text
27 passed
```

### Word Hunt

```powershell
npm run test:e2e -- `
  tests/word-hunt.spec.js `
  --workers=1
```

Expected:

```text
24 passed
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
Complete explicit Playwright regression: 231 passed
```

Never run bare:

```powershell
npm run test:e2e
```

Milestone and release validation must name the intended specs explicitly so
team-owned, retired, experimental, or incomplete tests cannot join the gate
accidentally.

## Run a focused suite

```powershell
npm run test:e2e -- tests/auth.spec.js --workers=1
npm run test:e2e -- tests/site-navigation.spec.js --workers=1
npm run test:e2e -- tests/platform-pages.spec.js --workers=1
npm run test:e2e -- tests/progress-and-character.spec.js --workers=1
npm run test:e2e -- tests/leaderboard.spec.js --workers=1
npm run test:e2e -- tests/admin.spec.js --workers=1
npm run test:e2e -- tests/tokenized-editor.spec.js --workers=1
npm run test:e2e -- tests/passage-reconstruction.spec.js --workers=1
npm run test:e2e -- tests/context-cloze-quest.spec.js --workers=1
npm run test:e2e -- tests/meaning-bridge.spec.js --workers=1
npm run test:e2e -- tests/word-hunt.spec.js --workers=1
```

## Run tests in a visible browser

Headed mode opens Chromium so the test can be watched while it runs.

Run one focused spec:

```powershell
npm run test:e2e:headed -- `
  tests/meaning-bridge.spec.js `
  --workers=1
```

Run one individual test by title:

```powershell
npm run test:e2e:headed -- `
  tests/meaning-bridge.spec.js `
  --grep "performs a real canvas match" `
  --workers=1
```

Run the complete verified suite in a visible browser:

```powershell
npm run test:e2e:headed -- `
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

Headed mode is intended for local inspection. GitHub Actions remains headless.

## Debug a test step by step

Playwright debug mode opens a visible browser and the Playwright Inspector:

```powershell
npm run test:e2e -- `
  tests/meaning-bridge.spec.js `
  --grep "generation error and retries" `
  --debug
```

Use the Inspector controls to continue, pause, step through actions, and inspect
locators.

## Use Playwright UI mode

UI mode provides an interactive test explorer:

```powershell
npm run test:e2e:ui
```

Open only one spec in UI mode:

```powershell
npm run test:e2e:ui -- tests/meaning-bridge.spec.js
```

UI mode is useful for selecting individual tests, reviewing traces, rerunning
failures, and watching each browser action.

## Open the HTML report

After a run that generated a report:

```powershell
npx playwright show-report
```

## Build validation

```powershell
npm run build
```

The production client build and the 231-test explicit suite must both pass before
a pull request is opened or merged.

The Vite large-chunk message is a warning. Treat a non-zero build exit as the
actual failure condition.

## Test architecture

### Deterministic authentication

Playwright starts Vite with the E2E authentication bypass enabled. The bypass
supports deterministic guest, email, sign-up, and Google flows without opening
Firebase or depending on a live authentication service.

Authentication tests can configure mapped users, failures, and delays before the
application loads. Production Firebase behavior remains unchanged outside the E2E
environment.

### Deterministic platform and Admin API mocks

`helpers/app-fixtures.js` mocks shared platform routes, including:

```text
active stories
progress configuration
daily progress visits
character purchases
leaderboards and player rank
```

`helpers/admin-fixtures.js` mocks Admin and editor routes, including:

```text
LearnSanskrit and Sanskrit source APIs
story download and metadata actions
story upload
tokenized-story retrieval
Story Set retrieval, creation, activation, and deletion
Tokenized Editor GET and PUT
```

### Deterministic canvas-game fixtures

Each completed canvas game has a dedicated helper:

```text
helpers/passage-reconstruction-fixtures.js
helpers/context-cloze-quest-fixtures.js
helpers/meaning-bridge-fixtures.js
helpers/word-hunt-fixtures.js
```

These helpers intercept only the real endpoints used by each game, return
reproducible responses, record request contracts, and expose launch utilities.
The browser still enters through Login, Story Picker, Launcher, GameScene, and
the ZIM holder.

The Playwright web server starts the Vite client only. Tests do not depend on
MongoDB, the Express server, Firebase, the external Python story service, or
production secrets.

### ZIMJS canvas bridges

Canvas internals do not expose normal DOM elements for cards, draggable words,
slots, timers, score labels, or feedback. Completed game suites therefore use
development/E2E-only bridges that:

```text
publish production state
publish live ZIM geometry
call or dispatch existing production handlers
avoid maintaining a second copy of gameplay rules
remove E2E globals when GameScene unmounts
```

Where practical, each game suite includes real Playwright mouse interaction
against live canvas geometry.

Detailed game evidence:

```text
client/tests/docs/README_PASSAGE_RECONSTRUCTION_e2e_TESTS.md
client/tests/docs/README_CONTEXT_CLOZE_QUEST_e2e_TESTS.md
client/tests/docs/README_MEANING_BRIDGE_e2e_TESTS.md
client/tests/docs/README_WORD_HUNT_e2e_TESTS.md
```

### Stable selectors

Production components expose documented `data-testid` attributes around normal
DOM controls and shared wrappers for ZIM canvases. These selectors improve test
stability without bypassing player or Admin behavior.

### Browser dialogs

Admin and editor tests attach the Playwright dialog listener before triggering
`alert()` or `confirm()`. Dialog handling and the triggering action run
concurrently because browser dialogs block the originating click handler.

### Native details elements

Download controls inside `<details>` are tested by opening the corresponding
`<summary>` before clicking the normally hidden button.

## Coverage highlights

### Authentication

- sign-in and sign-up mode switching
- deterministic email sign-in
- deterministic email sign-up
- deterministic Google sign-in
- guest authentication used by the player-facing suites
- friendly Firebase error mapping
- pending authentication and disabled controls
- logout and Story Picker gate restoration

### Site and platform

- mandatory Story Picker after authentication
- loading, API error, and empty Story Picker states
- single-story selection and session persistence
- launcher registration for all four games
- direct shared GameScene launch and Back behavior for all four games
- duplicate-launch protection
- logout and story-session reset
- About and all four How-to-Play flows
- shared canvas zoom limits, reset, and cross-scene persistence

### Progress and characters

- streak and star totals
- reward ladder and milestone gifts
- new-day reward toast and dismissal
- free, purchasable, and milestone characters
- local-storage character selection persistence
- selected-character propagation into GameScene
- affordability rules
- purchase success and server-error handling

### Leaderboards

- Master and four game boards
- dedicated Passage Reconstruction, Context Quiz, Meaning Bridge, and Word Hunt endpoints
- loading, empty, and error states
- podium and ranked rows
- score and time formatting
- current-player `You` state
- pinned current-player rank
- refresh and stale-response protection

### Admin and Story Sets

- non-admin users are denied access to the Admin surface
- lazy story-source loading
- source request deduplication
- source retrieval failures and retryable state
- story download success and failure handling
- metadata workflow success and failure handling
- multipart upload validation, success, and retry behavior
- tokenized-story loading, empty, and failure states
- tokenized-story selection and a maximum of four selected stories
- Story Set loading and empty states
- Story Set creation and automatic activation
- failed creation and failed automatic activation
- existing-set activation success and failure
- cancel, confirm, and failed deletion
- active-set deletion protection
- Tokenized Editor navigation

### Tokenized Story Editor

- initial load, refresh, failures, searching, and category filters
- story expansion and collapse
- general fields, dirty state, discard, successful save, and failed save
- English text, lemma, POS, definition, synonyms, and antonyms
- Sanskrit text, lemma, UPOS, XPOS, features, and definition
- nested sentence and word additions and deletions
- minimum word and sentence protections
- empty Sanskrit recovery
- legacy flat Sanskrit-array normalization
- simultaneous English and Sanskrit payload preservation

### Passage Reconstruction

- English and Sanskrit rounds
- loading and request contracts
- memorization and arrangement phases
- real canvas drag and order behavior
- hints, attempts, score penalties, and score floor
- countdown and results
- replay, reset, stale-response protection, and cleanup

### Context Cloze Quest

- English and Sanskrit
- easy, medium, and hard
- multi-select word types and menu protection
- live blank and word geometry
- real placement, replacement, movement, and return behavior
- incomplete, incorrect, partial, and perfect submissions
- hint limits, penalties, timer scoring, timeout behavior, score posting, failures, and cleanup

### Meaning Bridge

- Synonym, Definition, and Antonym challenges
- Practice and Timed Challenge modes
- timer presets and custom 1-to-60-minute clamping
- selected-story and generation request contracts
- live left-card and right-card geometry
- real correct and wrong canvas matches
- hint accounting, repeated hints, wrong-attempt penalties, and score floor
- production 4-to-5-to-6 pair progression
- guest and signed-in submission behavior
- duplicate-round protection and nonfatal persistent-save failure
- persistent and fallback leaderboards
- loading, generation error, keyboard retry, hint, skip, exit, timer expiry, and cleanup

### Word Hunt

- selected Story Picker ID, active Story Set ID, guest, and signed-in identity
- English and Sanskrit POS request and persistence contracts
- real landing Start, language toggle, Back, Hint, Next, Continue, Restart, and Exit clicks
- live passage-word and control geometry
- noun, verb, and adjective matching through real canvas clicks
- duplicate-word protection
- incorrect POS feedback and runtime-error protection
- noun, verb, and adjective Hint lifecycle
- base scoring, Hint penalty, completion multiplier, coins, and persisted metadata
- production noun-to-verb-to-adjective queue behavior
- real timer expiry, result controls, restart, exit, and cleanup
- rendered Noun, Verb, and Adjective winning-message text

Detailed evidence:

```text
client/tests/docs/README_WORD_HUNT_e2e_TESTS.md
```

## CI quality gate

The workflow explicitly runs eleven verified specs:

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

It installs dependencies, installs Chromium, builds the production client, runs
all 231 tests with one worker, and uploads Playwright diagnostics only when the
job fails.

## Scope boundary

The verified workflow now includes:

```text
NON-GAME-E2E:                         COMPLETE / GREEN
GAME-E2E-01 — Passage Reconstruction: COMPLETE / GREEN
GAME-E2E-02 — Context Cloze Quest:     COMPLETE / GREEN
GAME-E2E-03 — Meaning Bridge:          COMPLETE / GREEN
GAME-E2E-04 — Word Hunt:               COMPLETE / GREEN
```

Historical, team-owned, retired, experimental, or incomplete specs are not
automatically included.

## Admin authorization

The `/admin` and `/tokenized-editor` routes are wrapped by `RequireAdmin`.

In production, the client reads the user's Admin flag from Firestore. Protected
Admin requests include the signed-in user's Firebase ID token, and the server
independently verifies both the token and the Firestore Admin flag.

The deterministic Playwright suite does not contact Firebase or Firestore. Its
E2E-only authorization flag exercises both allowed and denied client-gate paths.
The server remains the authoritative security boundary for protected API
operations.

## Troubleshooting

### `test.describe()` was not expected here

Remove stale dependencies and restore the lockfile installation:

```powershell
Remove-Item node_modules -Recurse -Force
npm ci
npx playwright install chromium
```

Confirm that `@playwright/test`, `playwright`, and `playwright-core` resolve to
one matching version.

Also verify that top-level `test.describe()` blocks are siblings rather than
accidentally nested inside another describe block.

### Single-select option assertions

Use `locator("option").evaluateAll(...)` or `toHaveValue()` for a normal
single-select. `toHaveValues()` is for `<select multiple>`.

### Rejected checkbox actions

Use `click()` when the application intentionally prevents the checked state.
`check()` requires the checkbox to become checked.

### A headed browser does not appear

Confirm that Chromium is installed:

```powershell
npx playwright install chromium
```

Then rerun the focused spec with `npm run test:e2e:headed`.

### Reports

Local output is written under:

```text
client/playwright-report/
client/test-results/
```

The GitHub workflow uploads these directories only when the job fails.
