# Word Complex Non-Game Playwright E2E Tests

## Status

Verified locally on July 17, 2026:

```text
Client build:                    GREEN
Non-game Playwright tests:       122 passed
Playwright browser:              Chromium
Execution mode:                  sequential / one worker
Backend required for E2E:        No
Live MongoDB required for E2E:   No
Live Python story API required:  No
```

The non-game suite validates the player-facing site shell, progress features,
leaderboards, Admin page, Story Set management, and Tokenized Story Editor.
External APIs are intercepted with deterministic Playwright route mocks.

## Test inventory

| Spec                             |   Tests | Primary scope                                                                               |
| -------------------------------- | ------: | ------------------------------------------------------------------------------------------- |
| `site-navigation.spec.js`        |      14 | Guest login, Story Picker, launcher, shared GameScene navigation, logout, progress fallback |
| `platform-pages.spec.js`         |       9 | About page and approved How-to-Play flows                                                   |
| `progress-and-character.spec.js` |      12 | Daily rewards, streak toast, character selection, persistence, purchases                    |
| `leaderboard.spec.js`            |      13 | Board switching, loading, errors, podium/list rendering, rank pinning, refresh              |
| `admin.spec.js`                  |      22 | Story sources, downloads, metadata, uploads, tokenized stories, Story Sets                  |
| `tokenized-editor.spec.js`       |      32 | Loading, filtering, dirty state, save/discard, English tokens, Sanskrit sentences and words |
| **Total**                        | **122** | **Completed non-game milestone**                                                            |

## Files

```text
client/tests/
├── helpers/
│   ├── app-fixtures.js
│   └── admin-fixtures.js
├── site-navigation.spec.js
├── platform-pages.spec.js
├── progress-and-character.spec.js
├── leaderboard.spec.js
├── admin.spec.js
└── tokenized-editor.spec.js
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

From `client`:

```powershell
npm run test:e2e -- `
  tests/site-navigation.spec.js `
  tests/platform-pages.spec.js `
  tests/progress-and-character.spec.js `
  tests/leaderboard.spec.js `
  tests/admin.spec.js `
  tests/tokenized-editor.spec.js `
  --workers=1
```

Bash:

```bash
npm run test:e2e --   tests/site-navigation.spec.js   tests/platform-pages.spec.js   tests/progress-and-character.spec.js   tests/leaderboard.spec.js   tests/admin.spec.js   tests/tokenized-editor.spec.js   --workers=1
```

## Run a focused suite

```powershell
npm run test:e2e -- tests/site-navigation.spec.js
npm run test:e2e -- tests/platform-pages.spec.js
npm run test:e2e -- tests/progress-and-character.spec.js
npm run test:e2e -- tests/leaderboard.spec.js
npm run test:e2e -- tests/admin.spec.js
npm run test:e2e -- tests/tokenized-editor.spec.js
```

## Build validation

```powershell
npm run build
```

The client build and the 122-test suite should both pass before a pull request is
opened or merged.

## Test architecture

### Deterministic API mocks

`helpers/app-fixtures.js` mocks shared platform routes, including:

```text
active stories
progress configuration
daily progress visit
character purchase
leaderboards and player rank
```

`helpers/admin-fixtures.js` mocks Admin and editor routes, including:

```text
LearnSanskrit and Sanskrit source APIs
story download and metadata actions
story upload
tokenized-story retrieval
Story Set create/activate/delete
Tokenized Editor GET and PUT
```

The Playwright web server starts the Vite client only. Tests never depend on
MongoDB, the Express server, or the external Python service.

### Stable selectors

Production components expose commented `data-testid` attributes around normal
DOM controls and around shared wrappers for ZIM canvases. The selectors do not
bypass player/admin rules.

### Browser dialogs

Admin and editor tests attach the Playwright dialog listener before triggering
`alert()` or `confirm()`. The dialog and action are handled concurrently because
browser dialogs block the originating click handler.

### Native details elements

Download controls inside `<details>` are tested by opening the corresponding
`<summary>` before clicking the hidden button.

## Coverage highlights

### Site and platform

- mandatory Story Picker after guest authentication
- loading, API error, and empty Story Picker states
- single story selection and session persistence
- launcher registration for all four games
- shared GameScene launch and Back behaviour
- duplicate-launch protection
- logout and story-session reset
- About and approved How-to-Play navigation

### Progress and characters

- streak and star totals
- reward ladder and milestone gifts
- new-day reward toast and dismissal
- free, purchasable, and milestone characters
- local-storage selection persistence
- affordability rules
- purchase success and server-error handling

### Leaderboards

- Master and four game boards
- specialized Passage Reconstruction and Context Quiz endpoints
- loading, empty, and error states
- podium and ranked rows
- score/time formatting
- current-player `You` state
- pinned current-player rank
- refresh and stale-response protection

### Admin and Story Sets

- lazy story-source loading
- source request deduplication
- story download and failure handling
- metadata workflow requests
- multipart upload and validation
- tokenized-story selection
- maximum of four selected stories
- Story Set creation and automatic activation
- existing-set activation
- cancel/confirm deletion
- active-set deletion protection
- Tokenized Editor navigation

### Tokenized Story Editor

- initial load, refresh, failures, searching, and category filters
- story expansion and collapse
- general fields, dirty state, discard, successful save, and failed save
- English text, lemma, POS, definition, synonyms, and antonyms
- Sanskrit text, lemma, UPOS, XPOS, features, and definition
- nested sentence and word additions/deletions
- minimum word/sentence protections
- empty Sanskrit recovery
- legacy flat Sanskrit array normalization
- simultaneous English/Sanskrit payload preservation

## Scope boundary

This workflow intentionally runs the six verified non-game specs explicitly.
Historical or game-specific specs are not automatically included in this
milestone. Passage Reconstruction and Context Cloze Quest gameplay suites will
be added after their ZIM E2E hooks are implemented and verified.

## Known audit item

At the time of this milestone, `/admin` and `/tokenized-editor` are rendered
before the normal authentication gate in `App.jsx`. The current E2E tests verify
existing functionality; they do not declare anonymous Admin access to be the
desired security policy. Authorization should be handled in a separate,
explicit security change.

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

### Single-select option assertions

Use `locator("option").evaluateAll(...)` or `toHaveValue()` for a normal
single-select. `toHaveValues()` is for `<select multiple>`.

### Rejected checkbox actions

Use `click()` when the application intentionally prevents the checked state.
`check()` requires the checkbox to become checked.

### Reports

Local output is written under:

```text
client/playwright-report/
client/test-results/
```

The GitHub workflow uploads these directories only when the job fails.
