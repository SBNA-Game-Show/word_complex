# Word Complex Testing and CI

## Current automated quality gate

The current GitHub Actions browser workflow is:

```text
.github/workflows/playwright-client-e2e.yml
```

It is the explicit verified **181-test client Playwright** quality gate:

```text
Non-game suite:                  134
Passage Reconstruction:          20
Context Cloze Quest:             27
------------------------------------
Complete client E2E gate:       181
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
6. runs the seven verified non-game specs plus Passage Reconstruction and Context Cloze Quest with one worker;
7. uploads `playwright-report` and `test-results` only when the job fails.

The workflow uses an explicit nine-spec list. Meaning Bridge and Word Hunt remain excluded until each suite completes the same focused and combined validation process.

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
| `context-cloze-quest.spec.js` | 27 | Menu, languages, difficulties, real drag, placement, hints, scoring, timer, API, score posting, reset, stale requests, and cleanup |
| **Gameplay total** | **47** | **Verified gameplay portion of CI** |

### Complete verified client E2E gate

```text
Non-game:                  134
Passage Reconstruction:    20
Context Cloze Quest:       27
--------------------------------
Total:                     181
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
Context Cloze Quest: 27 passed
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
  --workers=1
```

Expected:

```text
Complete client Playwright suite: 181 passed
```

Do not use bare:

```powershell
npm run test:e2e
```

Milestone and release validation must name the intended specs explicitly so retired, experimental, or incomplete tests cannot join the gate accidentally.

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
27/27 focused
```

Coverage includes:

- default and real canvas menu behavior;
- English and Sanskrit;
- easy, medium, and hard;
- multiple word types and final-selection protection;
- selected-story and query serialization;
- live word and blank geometry;
- real canvas drag;
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
  tests/context-cloze-quest.spec.js `
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
  --workers=1
```

Headed mode is intended for local inspection. CI remains headless.

### Playwright Inspector

```powershell
npm run test:e2e -- `
  tests/context-cloze-quest.spec.js `
  --grep "real canvas drag" `
  --debug
```

### Playwright UI mode

```powershell
npm run test:e2e:ui -- tests/context-cloze-quest.spec.js
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

The current CI workflow names all nine verified specs:

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
```

Meaning Bridge and Word Hunt must remain excluded until their focused suites,
combined regression, production build, and documentation closeout are GREEN.

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
Build and run 181 client E2E tests
```

Do not configure a guessed check name. Let the workflow run successfully once, then select the exact visible check in branch-protection settings.

Pull requests must target `development`. Repository policy separately blocks pull requests targeting `testing` or `main`.

## Remaining gameplay sequence

Verified:

1. Passage Reconstruction — COMPLETE / GREEN
2. Context Cloze Quest — COMPLETE / GREEN

Next:

3. Meaning Bridge
4. Word Hunt

Each remaining game should use the same canvas methodology and two-stage validation/commit workflow.

## Security notes

- The workflow uses read-only repository contents permission.
- Deterministic browser tests require no production secrets.
- Do not add Firebase, MongoDB, API-key, or external-service secrets.
- Do not upload `.env`, storage-state, database exports, or raw request dumps.
- Admin-route authorization remains a separate security concern.
- Client-only Admin checks are not substitutes for server-side authorization.

## Pull-request evidence

A pull request containing the two completed gameplay milestones should include:

```text
Non-game Playwright result:                 134/134 passed
Passage Reconstruction focused result:        20/20 passed
Context Cloze Quest focused result:            27/27 passed
Complete client Playwright CI result:         181/181 passed
Client production build:                     GREEN
git diff --check:                             clean
```
