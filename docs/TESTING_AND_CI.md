# Word Complex Testing and CI

## Current automated quality gate

The reusable Playwright workflow is:

```text
.github/workflows/playwright-non-game.yml
```

It is invoked by:

```text
.github/workflows/promote-development.yml
```

after `development` is merged into `testing`. The reusable Playwright job checks out `testing` so the exact promotion candidate is built and tested.

The automated quality gate remains the verified **134-test non-game suite**. Passage Reconstruction is validated locally as a separate 20-test gameplay milestone. Gameplay will be added to CI in one deliberate update after all four game suites are complete.

## Client Playwright workflow

The reusable workflow uses:

```yaml
on:
  workflow_call:
```

The job:

1. checks out `testing`;
2. installs Node.js 24.12.0;
3. runs `npm ci` from `client`;
4. installs Chromium and Linux dependencies;
5. builds the production client;
6. runs the seven verified non-game specs with one worker;
7. uploads Playwright diagnostics only after failure.

The explicit inventory prevents team-owned or unfinished suites from silently joining the verified gate.

## Verified non-game inventory

| Spec | Tests | Primary scope |
|---|---:|---|
| `auth.spec.js` | 9 | Email, Google, guest, sign-up, errors, pending state, and logout |
| `site-navigation.spec.js` | 18 | Story Picker, launcher, four game scenes, logout, and canvas zoom |
| `platform-pages.spec.js` | 15 | About and all four How-to-Play flows |
| `progress-and-character.spec.js` | 13 | Rewards, streak toast, character selection, purchases, and GameScene propagation |
| `leaderboard.spec.js` | 13 | Board switching, loading, errors, ranking, formatting, and refresh |
| `admin.spec.js` | 34 | Admin authorization, sources, downloads, metadata, uploads, tokenized stories, Story Sets, and failure paths |
| `tokenized-editor.spec.js` | 32 | Loading, filtering, editing, save/discard, and English and Sanskrit tokens |
| **Total** | **134** | **Completed non-game Playwright milestone** |

The top-level `client/tests/admin.spec.js` belongs to the verified inventory.

Files under:

```text
client/tests/admin/
```

are team-owned and must not be modified, counted, or run as part of this deterministic inventory.

## Local validation

### Install and build

From the repository root:

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

A Vite chunk-size warning is not a build failure.

### Complete non-game suite

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
134 passed
```

### Focused specs

```powershell
npm run test:e2e -- tests/auth.spec.js --workers=1
npm run test:e2e -- tests/site-navigation.spec.js --workers=1
npm run test:e2e -- tests/platform-pages.spec.js --workers=1
npm run test:e2e -- tests/progress-and-character.spec.js --workers=1
npm run test:e2e -- tests/leaderboard.spec.js --workers=1
npm run test:e2e -- tests/admin.spec.js --workers=1
npm run test:e2e -- tests/tokenized-editor.spec.js --workers=1
npm run test:e2e -- tests/passage-reconstruction.spec.js --workers=1
```

### Current combined regression

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

Do not use bare `npm run test:e2e`, because Playwright may discover team-owned tests under `client/tests/admin/`.

### Repository checks

```powershell
cd C:\Users\Nawaf\Desktop\word_complex

git diff --check
git status --short
git diff --stat
git diff --name-status
```

Do not stage generated reports, test results, source dumps, `.env` files, build output, or dependency directories.

## Verified gameplay milestones

### Passage Reconstruction

```text
Spec:                                  tests/passage-reconstruction.spec.js
Fixtures:                              tests/helpers/passage-reconstruction-fixtures.js
Focused result:                        20/20 passed
Verified non-game result:              134/134 passed
Combined verified regression:          154/154 passed
Client production build:               GREEN
```

Coverage includes English, Sanskrit, selected-story propagation, preview and timer behavior, deterministic phrase and slot state, one real canvas drag, partial and wrong answers, Reset, hints, attempt exhaustion, retry, scoring, round progression, timeout, natural completion, time bonus, Play Again, guest and signed-in score rules, score-request failure, and teardown cleanup.

Detailed documentation:

```text
client/tests/docs/README_PASSAGE_RECONSTRUCTION_e2e_TESTS.md
```

Gameplay progress:

- [x] Passage Reconstruction — 20/20 focused, 154/154 combined
- [ ] Context Cloze Quest — next
- [ ] Meaning Bridge
- [ ] Word Hunt

## Interactive Playwright modes

### Headed mode

```powershell
npm run test:e2e:headed -- `
  tests/passage-reconstruction.spec.js `
  --workers=1
```

One matching test:

```powershell
npm run test:e2e:headed -- `
  tests/passage-reconstruction.spec.js `
  --grep "performs a real canvas drag" `
  --workers=1
```

### Inspector

```powershell
npm run test:e2e -- `
  tests/passage-reconstruction.spec.js `
  --grep "three wrong checks reach round-over" `
  --debug
```

### UI mode

```powershell
npm run test:e2e:ui -- tests/passage-reconstruction.spec.js
```

### HTML report

```powershell
npx playwright show-report
```

## Workflow design

### Node and installation

The workflow uses Node.js 24.12.0 and `npm ci`. Keep `client/package-lock.json` synchronized with `client/package.json`.

### One worker

Verified suites use `--workers=1` for reproducibility and to avoid cross-test resource contention.

### Explicit CI inventory

The reusable workflow currently runs:

```text
tests/auth.spec.js
tests/site-navigation.spec.js
tests/platform-pages.spec.js
tests/progress-and-character.spec.js
tests/leaderboard.spec.js
tests/admin.spec.js
tests/tokenized-editor.spec.js
```

Passage Reconstruction remains outside the reusable workflow until all four game suites are complete. This avoids changing CI after every game and allows one deliberate full-platform workflow update.

### Deterministic browser testing

Verified browser suites start the Vite server and use deterministic authentication and API fixtures. They do not require Express, MongoDB, live Firebase, or external story services.

Canvas test bridges must:

- be clearly commented;
- be enabled only in development/E2E conditions;
- invoke production game functions rather than duplicate game rules;
- be removed during teardown;
- never expose credentials or tokens.

### Failure artifacts

Only generated diagnostics should be uploaded after failure. Never include secrets, `.env` files, storage state, database exports, or raw request dumps.

## Admin authorization

The `/admin` and `/tokenized-editor` routes are wrapped by `RequireAdmin`.

Production behavior:

1. the client checks the user's private Firestore account document for the Admin flag;
2. protected requests include the user's Firebase ID token;
3. the server independently verifies the token and Admin flag;
4. the server remains the authoritative authorization boundary.

The deterministic E2E environment uses E2E-only authorization configuration and does not call live Firebase or Firestore.

## Branch protection

The reusable job is named:

```text
Build and run 134 non-game E2E tests
```

Because it is called by the promotion workflow, confirm the exact GitHub check name before configuring branch protection.

Pull requests target `development`. Repository policy blocks pull requests targeting `testing` or `main`.

## Extending gameplay coverage

For every game:

1. inspect current production and service paths;
2. add the minimum commented ZIM E2E plumbing;
3. use deterministic API fixtures;
4. include a real player interaction where practical;
5. run the focused spec;
6. run the explicit combined regression;
7. run the production build;
8. document the count and coverage;
9. commit the game milestone independently.

After all four games are complete:

1. add all four specs to CI together;
2. rename the workflow if it becomes a full-platform suite;
3. update `client/tests/docs/README_e2e.md`;
4. update the total and branch-protection check name;
5. run the full CI job with one worker;
6. confirm the workflow tests the exact `testing` candidate.

## Security notes

- No production secrets are required for deterministic browser tests.
- Do not add Firebase, MongoDB, API-key, or Python-service secrets.
- Do not upload `.env`, storage-state files, database exports, or raw request dumps.
- E2E hooks must not expose credentials, tokens, or private account data.
- Server-side authentication and authorization remain authoritative.

## Pull-request evidence

```text
Platform-page Playwright result:          15/15 passed
Complete non-game Playwright result:     134/134 passed
Passage Reconstruction result:            20/20 passed
Combined verified regression:            154/154 passed
Client build command and GREEN result
Reusable 134-test Playwright workflow result
git diff --check clean result
```

Do not claim that Passage Reconstruction ran in GitHub Actions until gameplay is added to the reusable workflow.
