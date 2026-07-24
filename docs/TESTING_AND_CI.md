# Word Complex Testing and CI

## Current automated quality gate

The current GitHub Actions browser workflow is:

```text
.github/workflows/playwright-client-e2e.yml
```

It is the explicit verified **231-test client Playwright** quality gate:

```text
Non-game suite:                  134
Passage Reconstruction:          20
Context Cloze Quest:             26
Meaning Bridge:                  27
Word Hunt:                       24
------------------------------------
Complete client E2E gate:       231
```

Server-test automation remains outside this Playwright closeout scope.

## Client Playwright workflow

`playwright-client-e2e.yml` is called by the development-promotion workflow after `development` is merged into `testing`.

The promotion workflow is:

```text
.github/workflows/promote-development.yml
```

The client E2E job:

1. checks out the repository;
2. installs Node.js 24.12.0;
3. runs `npm ci` from `client`;
4. installs Chromium and its Linux dependencies;
5. runs the production client build;
6. runs the seven verified non-game specs plus Passage Reconstruction, Context Cloze Quest, Meaning Bridge, and Word Hunt with one worker;
7. uploads `playwright-report` and `test-results` only when the job fails.

The workflow uses an explicit eleven-spec list.

GitHub Actions runs Chromium headlessly. Headed mode, Playwright Inspector, and UI mode are local diagnostic tools.

## Verified test inventory

### Non-game inventory

| Spec | Tests | Primary scope |
|---|---:|---|
| `auth.spec.js` | 9 | Email, Google, guest, sign-up, errors, pending state, and logout |
| `site-navigation.spec.js` | 18 | Story Picker, launcher, four shared game scenes, logout, and canvas zoom |
| `platform-pages.spec.js` | 15 | About and all four How-to-Play flows |
| `progress-and-character.spec.js` | 13 | Rewards, streak toast, character selection, purchases, and GameScene propagation |
| `leaderboard.spec.js` | 13 | Board switching, loading, errors, ranking, formatting, and refresh |
| `admin.spec.js` | 34 | Sources, downloads, metadata, uploads, tokenized stories, Story Sets, and failure paths |
| `tokenized-editor.spec.js` | 32 | Loading, filtering, editing, save/discard, and English and Sanskrit tokens |
| **Non-game total** | **134** | **Verified non-game portion** |

### Verified gameplay inventory

| Spec | Tests | Primary scope |
|---|---:|---|
| `passage-reconstruction.spec.js` | 20 | Canvas rounds, drag/order behavior, hints, scoring, timer, API, results, reset, and cleanup |
| `context-cloze-quest.spec.js` | 26 | Menu, languages, difficulties, placement, hints, scoring, timer, API, score posting, reset, stale requests, and cleanup |
| `meaning-bridge.spec.js` | 27 | Modes, requests, real canvas matches, hints, penalties, progression, submission, persistence, leaderboards, keyboard, timer, exit, errors, and cleanup |
| `word-hunt.spec.js` | 24 | Landing, language, passage geometry, POS matching, hints, timer, queue, scoring, results, persistence, navigation, and cleanup |
| **Gameplay total** | **97** | **Verified gameplay portion of CI** |

### Complete verified client E2E gate

```text
Non-game:                  134
Passage Reconstruction:    20
Context Cloze Quest:       26
Meaning Bridge:            27
Word Hunt:                 24
--------------------------------
Total:                     231
```

## Local release validation

Run from the repository root unless a section says otherwise.

### Install and build the client

```powershell
cd client

npm ci
npx playwright install chromium

npm run build
```

Expected:

```text
Client production build: GREEN
```

The Vite large-chunk warning is non-fatal. Treat an actual non-zero build exit as failure.

### Run the non-game portion

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
  --workers=1
```

Expected:

```text
Non-game Playwright suite: 134 passed
```

### Run Passage Reconstruction

```powershell
npm run test:e2e -- `
  tests/passage-reconstruction.spec.js `
  --workers=1
```

Expected:

```text
Passage Reconstruction: 20 passed
```

### Run Context Cloze Quest

```powershell
npm run test:e2e -- `
  tests/context-cloze-quest.spec.js `
  --workers=1
```

Expected:

```text
Context Cloze Quest: 26 passed
```

### Run Meaning Bridge

```powershell
npm run test:e2e -- `
  tests/meaning-bridge.spec.js `
  --workers=1
```

Expected:

```text
Meaning Bridge: 27 passed
```

### Run Word Hunt

```powershell
npm run test:e2e -- `
  tests/word-hunt.spec.js `
  --workers=1
```

Expected:

```text
Word Hunt: 24 passed
```

### Run the complete client CI suite

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

Expected:

```text
Complete client Playwright suite: 231 passed
```

Do not use bare:

```powershell
npm run test:e2e
```

Milestone and release validation must name the intended specs explicitly so retired, experimental, incomplete, or team-owned tests cannot join the gate accidentally.

### Syntax and repository checks

Return to the repository root:

```powershell
cd C:\Users\Nawaf\Desktop\word_complex

node --check `
  .\client\tests\helpers\passage-reconstruction-fixtures.js

node --check `
  .\client\tests\passage-reconstruction.spec.js

node --check `
  .\client\tests\helpers\context-cloze-quest-fixtures.js

node --check `
  .\client\tests\context-cloze-quest.spec.js

node --check `
  .\client\tests\helpers\meaning-bridge-fixtures.js

node --check `
  .\client\tests\meaning-bridge.spec.js

node --check `
  .\client\src\games\WordHunt\e2eTestBridge.js

node --check `
  .\client\tests\helpers\word-hunt-fixtures.js

node --check `
  .\client\tests\word-hunt.spec.js

git diff --check
git status --short
git diff --stat
git diff --name-status
```

Generated reports, test results, source dumps, `.env` files, build output, and dependency directories must not be staged.

## Canvas-game Playwright methodology

The player-facing game experience remains inside ZIMJS Canvas. React is the shell for authentication, story selection, launcher navigation, GameScene, persistence, and platform APIs.

A verified canvas game suite should use:

1. deterministic API fixtures;
2. real application entry through Story Picker, launcher, and GameScene;
3. a development/E2E-only state bridge because canvas internals have no normal DOM accessibility tree;
4. adjacent comments for every team-file E2E change;
5. live ZIM geometry for at least one real Playwright mouse interaction where practical;
6. deterministic commands that invoke existing production handlers rather than reimplementing rules;
7. explicit cleanup of test globals on unmount;
8. focused tests before the combined regression;
9. a production client build after plumbing changes;
10. documentation of the exact verified test count and current behavior.

### Passage Reconstruction

Verified:

```text
20/20 focused
```

Coverage includes:

- English and Sanskrit rounds;
- loading and request behavior;
- memorization and arrangement phases;
- real canvas drag/order behavior;
- hints, attempts, score penalties, and score floor;
- countdown and results;
- replay/reset;
- stale-response and cleanup behavior.

Detailed evidence:

```text
client/tests/docs/README_PASSAGE_RECONSTRUCTION_e2e_TESTS.md
```

### Context Cloze Quest

Verified:

```text
26/26 focused
```

Coverage includes:

- default and real canvas menu behavior;
- English and Sanskrit;
- easy, medium, and hard;
- multiple word types and final-selection protection;
- selected-story and query serialization;
- live word and blank geometry;
- occupied-blank replacement and word return;
- incomplete, perfect, partial, and incorrect submissions;
- hint limits, no-spend cases, and penalties;
- timer scoring and current timeout behavior;
- Reset, Menu, stale requests, failures, score posting, and cleanup.

Current timeout contract:

```text
remainingTime: 0
timerRunning: false
timedOut: true
roundSubmitted: false
controlsLocked: false
```

Detailed evidence:

```text
client/tests/docs/README_CONTEXT_CLOZE_QUEST_e2e_TESTS.md
```

### Meaning Bridge

Verified:

```text
27/27 focused
```

Coverage includes:

- Synonym, Definition, and Antonym challenge modes;
- Practice and Timed Challenge setup;
- 2-, 5-, 10-, and custom 1-to-60-minute timer selection;
- selected Story Picker ID and production request serialization;
- live left-card and right-card ZIM geometry;
- real correct and incorrect browser mouse interactions;
- scoring, wrong-attempt penalties, and hint accounting;
- production 4-to-5-to-6 pair progression;
- guest and signed-in submission behavior;
- duplicate-round protection;
- persistent best-score success and nonfatal failure;
- persistent and fallback leaderboards;
- loading, generation error, and retry;
- keyboard `H`, `R`, `S`, and `Escape` paths;
- production timed expiry and next-round advancement;
- exit cancellation, reset, and lifecycle cleanup.

Detailed evidence:

```text
client/tests/docs/README_MEANING_BRIDGE_e2e_TESTS.md
```

### Word Hunt

Verified:

```text
24/24 focused
```

Coverage includes:

- selected-story, Story Set, guest, and signed-in identity;
- English and Sanskrit request and persistence contracts;
- real canvas landing, language, navigation, result, and passage-word clicks;
- noun, verb, and adjective matching and duplicate protection;
- incorrect POS feedback and runtime-error protection;
- noun, verb, and adjective Hint lifecycle;
- production scoring, Hint penalties, multipliers, coins, and metadata;
- noun-to-verb-to-adjective queue behavior;
- real timer expiry, Restart, Exit, and cleanup;
- rendered result wording for all three POS rounds.

Detailed evidence:

```text
client/tests/docs/README_WORD_HUNT_e2e_TESTS.md
```

## Deterministic browser tests

The Playwright suite starts the Vite web server configured by `playwright.config.js`.

Authentication, platform APIs, game APIs, and score endpoints are intercepted by deterministic E2E hooks and fixtures. The browser tests do not require:

```text
Express server
MongoDB
Firebase
external story services
production secrets
```

The real frontend services, request serialization, React navigation, ZIM rendering, game handlers, and browser event paths remain active.

## Interactive Playwright modes

### Headed mode

Run one focused game suite visibly:

```powershell
npm run test:e2e:headed -- `
  tests/meaning-bridge.spec.js `
  --workers=1
```

Run the complete verified regression visibly:

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

Headed mode is intended for local inspection. CI remains headless.

### Playwright UI mode

```powershell
npm run test:e2e:ui -- tests/meaning-bridge.spec.js
```

### HTML report

```powershell
npx playwright show-report
```

## Workflow design decisions

### Node version

The Playwright workflow uses Node.js `24.12.0`, matching the verified client development environment.

### Lockfile installation

The workflow uses `npm ci`, so `client/package-lock.json` must remain committed and synchronized with `client/package.json`.

### One Playwright worker

Browser validation uses `--workers=1` for reproducibility and to avoid cross-test resource contention.

### Explicit test inventory

The current CI workflow names all eleven verified specs:

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

### Headless CI

GitHub Actions runs Chromium headlessly. Headed mode, Inspector, and UI mode require an interactive desktop session.

### Concurrency cancellation

A newer push to the same branch cancels an older in-progress Playwright run. This avoids reviewing obsolete results.

### Failure artifacts

Playwright reports and traces can contain application data. Upload only generated diagnostics, only after failure, with limited retention.

Never add secrets, `.env` files, browser storage-state files, database exports, or raw request dumps to artifact paths.

## Recommended branch protection

Require the complete client E2E check:

```text
Build and run 231 client E2E tests
```

Do not configure a guessed check name. Let the workflow run successfully once, then select the exact visible check in branch-protection settings.

Pull requests must target `development`. Repository policy separately blocks pull requests targeting `testing` or `main`.

## Completed gameplay sequence

Verified:

1. Passage Reconstruction — COMPLETE / GREEN
2. Context Cloze Quest — COMPLETE / GREEN
3. Meaning Bridge — COMPLETE / GREEN
4. Word Hunt — COMPLETE / GREEN

All four current gameplay suites are included in the explicit client Playwright
quality gate.

## Security notes

- The workflow uses read-only repository contents permission.
- Deterministic browser tests require no production secrets.
- Do not add Firebase, MongoDB, API-key, or external-service secrets.
- Do not upload `.env`, storage-state, database exports, or raw request dumps.
- Admin-route authorization remains a separate security concern.
- Client-only Admin checks are not substitutes for server-side authorization.

## Pull-request evidence

A pull request containing the four completed gameplay milestones should include:

```text
Non-game Playwright result:                 134/134 passed
Passage Reconstruction focused result:        20/20 passed
Context Cloze Quest focused result:            26/26 passed
Meaning Bridge focused result:                 27/27 passed
Word Hunt focused result:                      24/24 passed
Complete client Playwright CI result:         231/231 passed
Client production build:                     GREEN
git diff --check:                             clean
```
