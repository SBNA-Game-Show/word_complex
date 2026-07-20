# Word Complex Testing and CI

## Continuous-integration workflows

The repository uses two independent workflows:

```text
.github/workflows/playwright-non-game.yml
.github/workflows/server-tests.yml
```

Keeping the workflows separate makes failures easy to classify and prevents
server-only changes from installing a browser.

## Client Playwright workflow

`playwright-non-game.yml` runs when:

- a push targets `development` or `main` and changes `client/**`;
- a pull request targets `development` or `main` and changes `client/**`;
- it is started manually through `workflow_dispatch`.

The job:

1. checks out the repository;
2. installs Node.js 24.12.0;
3. runs `npm ci` from `client`;
4. installs Chromium and Linux dependencies;
5. runs the production client build;
6. runs the six verified non-game Playwright specs with one worker;
7. uploads `playwright-report` and `test-results` only on failure.

The explicit spec list prevents unrelated historical game tests from silently
joining the completed non-game quality gate.

## Server workflow

`server-tests.yml` runs when:

- a push targets `development` or `main` and changes `server/**`;
- a pull request targets `development` or `main` and changes `server/**`;
- it is started manually.

The job:

1. checks out the repository;
2. installs Node.js 24.12.0;
3. runs `npm ci` from `server`;
4. runs `npm test` with `NODE_ENV=test`.

## Local release validation

Run from the repository root.

### Client

```powershell
cd client

npm ci
npx playwright install chromium

npm run build

npm run test:e2e -- `
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
Client build:               GREEN
Non-game Playwright suite:  122 passed
```

### Server

```powershell
cd ..\server
npm ci
npm test
```

Record the exact server test total from the local run and GitHub Actions output.
Do not claim a server test count in documentation unless it was observed.

## Workflow design decisions

### Node version

Both workflows use Node.js `24.12.0`, matching the verified local development
environment.

### Lockfiles

Both workflows use `npm ci`, so `client/package-lock.json` and
`server/package-lock.json` must be committed and synchronized with their
package manifests.

### One Playwright worker

The browser suite uses `--workers=1` for reproducibility and to avoid
cross-test resource contention in GitHub-hosted runners.

### No live backend for browser tests

The Playwright suite starts the Vite web server configured by
`playwright.config.js`. Platform and Admin API calls are intercepted by shared
fixtures. This keeps browser tests deterministic and prevents accidental calls
to MongoDB or external story services.

### Concurrency cancellation

A newer push to the same branch cancels an older in-progress run. This reduces
GitHub Actions usage and avoids reviewing obsolete results.

### Failure artifacts

Playwright reports and traces can contain application data. The workflow uploads
only generated test diagnostics, only after failure, and retains them for 14
days. Secrets and `.env` files must never be added to artifact paths.

## Recommended branch protection

For `development` and `main`, require these checks before merge:

```text
Build and run 122 non-game E2E tests
Run server npm test
```

Do not require a workflow until it has completed successfully at least once on
the repository and its check name is visible in branch-protection settings.

## Extending the client workflow

When a new verified gameplay suite is completed:

1. run it locally from a clean `npm ci` installation;
2. document its test count and scope;
3. add its spec path to `playwright-non-game.yml` or rename the workflow when it
   becomes a full-platform suite;
4. update `client/tests/README_e2e.md`;
5. confirm the full CI job remains stable with one worker.

## Security notes

- Workflows use read-only repository contents permission.
- No secrets are required for the deterministic non-game browser suite.
- Do not add production Firebase, MongoDB, API-key, or Python-service secrets.
- Do not upload `.env`, browser storage-state files, database exports, or raw
  request dumps as artifacts.
- Admin-route authorization remains an open, separately tracked audit concern.

## Pull-request evidence

A pull request for this milestone should include:

```text
Client build command and GREEN result
122/122 non-game Playwright result
Server npm test result
GitHub Playwright workflow result
GitHub server workflow result
git diff --check result
```
