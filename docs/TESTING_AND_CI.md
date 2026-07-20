# Word Complex Testing and CI

## Current automated quality gate

The current automated testing workflow is:

```text
.github/workflows/playwright-non-game.yml
```

This milestone intentionally focuses on the verified non-game Playwright suite.
Server-test automation is outside the current Playwright closeout scope.

## Client Playwright workflow

`playwright-non-game.yml` is a reusable workflow triggered through
`workflow_call`.

`promote-development.yml` invokes it after `development` is merged into the
`testing` branch. The reusable workflow explicitly checks out `testing`, builds
the client, and runs the verified non-game Playwright suite before promotion can
continue.

Other release steps in `promote-development.yml` are outside the scope of this
Playwright testing guide.

The job:

1. checks out the repository;
2. installs Node.js 24.12.0;
3. runs `npm ci` from `client`;
4. installs Chromium and its Linux dependencies;
5. runs the production client build;
6. runs the seven verified non-game Playwright specs with one worker;
7. uploads `playwright-report` and `test-results` only when the job fails.

The explicit spec list prevents retired or incomplete gameplay suites from
silently joining the completed non-game quality gate.

GitHub Actions runs Chromium headlessly. Headed mode, Playwright Inspector, and
UI mode are local diagnostic tools and are not used in CI.

## Verified non-game inventory

| Spec                             |   Tests | Primary scope                                                                           |
| -------------------------------- | ------: | --------------------------------------------------------------------------------------- |
| `auth.spec.js`                   |       9 | Email, Google, guest, sign-up, errors, pending state, and logout                        |
| `site-navigation.spec.js`        |      18 | Story Picker, launcher, four shared game scenes, logout, and canvas zoom                |
| `platform-pages.spec.js`         |      15 | About and all four How-to-Play flows                                                    |
| `progress-and-character.spec.js` |      13 | Rewards, streak toast, character selection, purchases, and GameScene propagation        |
| `leaderboard.spec.js`            |      13 | Board switching, loading, errors, ranking, formatting, and refresh                      |
| `admin.spec.js`                  |      34 | Sources, downloads, metadata, uploads, tokenized stories, Story Sets, and failure paths |
| `tokenized-editor.spec.js`       |      32 | Loading, filtering, editing, save/discard, and English and Sanskrit tokens              |
| **Total**                        | **134** | **Completed non-game Playwright milestone**                                             |

## Local release validation

Run from the repository root.

### Install and build the client

```powershell
cd client

npm ci
npx playwright install chromium

npm run build
```

Expected:

```text
Client build: GREEN
```

### Run the complete non-game suite

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

### Run a focused suite

```powershell
npm run test:e2e -- tests/auth.spec.js --workers=1
npm run test:e2e -- tests/site-navigation.spec.js --workers=1
npm run test:e2e -- tests/platform-pages.spec.js --workers=1
npm run test:e2e -- tests/progress-and-character.spec.js --workers=1
npm run test:e2e -- tests/leaderboard.spec.js --workers=1
npm run test:e2e -- tests/admin.spec.js --workers=1
npm run test:e2e -- tests/tokenized-editor.spec.js --workers=1
```

### Repository checks

Return to the repository root:

```powershell
cd C:\Users\Nawaf\Desktop\word_complex

git diff --check
git status --short
git diff --stat
git diff --name-status
```

Generated reports, test results, source dumps, `.env` files, build output, and
dependency directories must not be staged.

## Interactive Playwright modes

### Run tests in a visible browser

Headed mode opens Chromium so the browser can be watched while the test runs.

Run one focused spec:

```powershell
npm run test:e2e:headed -- `
  tests/admin.spec.js `
  --workers=1
```

Run one matching test:

```powershell
npm run test:e2e:headed -- `
  tests/admin.spec.js `
  --grep "failed upload preserves the selected file" `
  --workers=1
```

Run the complete non-game suite in a visible browser:

```powershell
npm run test:e2e:headed -- `
  tests/auth.spec.js `
  tests/site-navigation.spec.js `
  tests/platform-pages.spec.js `
  tests/progress-and-character.spec.js `
  tests/leaderboard.spec.js `
  tests/admin.spec.js `
  tests/tokenized-editor.spec.js `
  --workers=1
```

Headed mode is intended for local inspection. CI remains headless.

### Debug with Playwright Inspector

```powershell
npm run test:e2e -- `
  tests/admin.spec.js `
  --grep "failed Story Set deletion" `
  --debug
```

The Inspector can pause execution, step through actions, inspect locators, and
continue the test.

### Open Playwright UI mode

```powershell
npm run test:e2e:ui
```

Open only one spec:

```powershell
npm run test:e2e:ui -- tests/admin.spec.js
```

UI mode supports selecting individual tests, rerunning failures, watching
browser actions, and reviewing traces.

### Open the HTML report

After a run that generated a report:

```powershell
npx playwright show-report
```

## Workflow design decisions

### Node version

The Playwright workflow uses Node.js `24.12.0`, matching the verified local
client development environment.

### Lockfile installation

The workflow uses `npm ci`, so `client/package-lock.json` must remain committed
and synchronized with `client/package.json`.

### One Playwright worker

The browser suite uses `--workers=1` for reproducibility and to avoid cross-test
resource contention in GitHub-hosted runners.

### Explicit test inventory

The workflow names all seven verified non-game specs:

```text
tests/auth.spec.js
tests/site-navigation.spec.js
tests/platform-pages.spec.js
tests/progress-and-character.spec.js
tests/leaderboard.spec.js
tests/admin.spec.js
tests/tokenized-editor.spec.js
```

Historical gameplay files are excluded until each game suite is deliberately
rebuilt and validated.

### Deterministic browser tests

The Playwright suite starts the Vite web server configured by
`playwright.config.js`.

Authentication and platform/Admin API calls are intercepted by deterministic
E2E hooks and shared fixtures. The browser suite does not require the Express
server, MongoDB, Firebase, or external story services.

### Headless CI

GitHub Actions runs Chromium headlessly. Headed mode, Playwright Inspector, and
UI mode require an interactive desktop session and remain local-only.

### Concurrency cancellation

A newer push to the same branch cancels an older in-progress Playwright run.
This reduces GitHub Actions usage and avoids reviewing obsolete results.

### Failure artifacts

Playwright reports and traces can contain application data. The workflow uploads
only generated diagnostics, only after failure, and retains them for 14 days.

Secrets and `.env` files must never be added to artifact paths.

## Recommended branch protection

For `development`, require this check before merge:

```text
Build and run 134 non-game E2E tests
```

Do not require the workflow until it has completed successfully at least once
and its exact check name is visible in the branch-protection settings.

Pull requests must target `development`. The separate repository-policy workflow
blocks pull requests that target `testing` or `main`.

## Extending the Playwright workflow

When a new verified gameplay suite is completed:

1. run it locally from a clean `npm ci` installation;
2. document its exact test count and scope;
3. add its spec path to the client workflow, or rename the workflow when it
   becomes a full-platform suite;
4. update `client/tests/docs/README_e2e.md`;
5. update the expected total and branch-protection check name;
6. confirm the full CI job remains stable with one worker.

All four gameplay suites will be rebuilt using one consistent ZIMJS canvas
Playwright methodology:

1. Passage Reconstruction
2. Context Cloze Quest
3. Meaning Bridge
4. Word Hunt

## Security notes

- The workflow uses read-only repository contents permission.
- No production secrets are required for the deterministic non-game browser suite.
- Do not add production Firebase, MongoDB, API-key, or Python-service secrets.
- Do not upload `.env`, browser storage-state files, database exports, or raw
  request dumps as artifacts.
- Admin routes use a client-side `RequireAdmin` gate for user experience.
- Protected Admin API operations are independently enforced server-side using a
  verified Firebase ID token and the Firestore Admin flag.
- The deterministic Playwright suite uses only E2E authorization plumbing and
  does not require live Firebase or Firestore access.

## Pull-request evidence

A pull request for this milestone should include:

```text
Platform-page Playwright result: 15/15 passed
Complete non-game Playwright result: 134/134 passed
Client build command and GREEN result
GitHub Playwright workflow result
git diff --check clean result
```
