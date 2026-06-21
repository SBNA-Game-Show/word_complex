# Meaning Bridge Playwright E2E Tests

This document explains the Meaning Bridge Playwright test coverage in:

```text
client/tests/meaning-bridge.spec.js
```

The tests are designed to follow Jacob's testing guidance: use stable `data-testid` attributes where the DOM exists, and avoid fragile UI selectors that break when teammates change styling.

Because Meaning Bridge is a ZIMJS canvas game, the tests also use keyboard shortcuts and the game's debug state object to assert behavior safely.

## Why Meaning Bridge needs a special testing approach

Most Meaning Bridge gameplay UI is drawn inside a ZIMJS canvas. Playwright can see the canvas holder, but it cannot directly select individual cards, labels, or ZIM buttons as DOM elements.

For that reason, the tests use this approach:

```text
DOM shell:
- data-testid selectors

Canvas gameplay:
- keyboard shortcuts
- window.__meaningBridgeZimDebug assertions
- mocked API responses
```

This gives stable tests without relying on canvas coordinates.

## Stable DOM test IDs used

The tests rely on stable test IDs such as:

```text
username-input
password-input
login-button
launcher-page
game-start-meaning-bridge
game-screen-meaning-bridge
canvas-shell-meaning-bridge
zim-meaning-bridge-game
```

These IDs should be preserved if the UI is restyled.

## Debug state used by the tests

Meaning Bridge exposes debug state through:

```js
window.__meaningBridgeZimDebug
```

The Playwright tests assert fields such as:

```text
screen
roundType
timerOption
timerSeconds
customTimerMinutes
isEditingCustomTimer
remainingRoundSeconds
timerRunning
roundId
matches
selectedLeftId
hintsUsed
wrongAttempts
resultVisible
quitConfirmVisible
soundMuted
largeTextMode
leaderboardReturnScreen
```

This makes the tests much more stable than clicking arbitrary canvas coordinates.

## API routes mocked

The test file mocks the Meaning Bridge API endpoints:

```text
POST /api/v1/meaningBridge/generate
POST /api/v1/meaningBridge/submit
GET  /api/v1/meaningBridge/leaderboard
```

The mocked round uses predictable cards:

```text
1. river   -> नदी
2. forest  -> वन
3. teacher -> गुरु
4. light   -> प्रकाश
```

This lets keyboard shortcuts select known correct pairs.

## Test groups

### 1. Meaning Bridge smoke tests

These tests verify that the basic app and game flow works.

Coverage:

```text
- Login reaches the launcher
- Meaning Bridge launches from the launcher
- ZIMJS canvas holder appears
- Landing opens setup with Enter
- Rules screen opens and closes from landing
- Leaderboard screen opens and closes from landing
- Large Text mode toggles with Z
- Sound mute toggles with V
- Practice round starts
- Quit confirmation protects an active round
- Escape cancels quit confirmation
- Confirming quit returns to setup
```

### 2. Meaning Bridge timed setup tests

These tests verify the timed round setup flow.

Coverage:

```text
- Timed mode can be selected from setup
- Timer preset shortcuts update timer seconds
- 1 selects 2:00
- 2 selects 5:00
- 3 selects 10:00
- Custom timer editing works with C
- Custom timer updates timerSeconds
- Timed round starts with countdown state
- Custom timed round starts with selected custom countdown
```

### 3. Meaning Bridge match and result tests

These tests verify actual gameplay state.

Coverage:

```text
- Correct pair can be matched with keyboard shortcuts
- Hint shortcut increments hint count after selecting a card
- Reset clears matches, selected card, hints, and wrong attempts
- Submit after a match shows result state
- Leaderboard opens from result screen
- Returning from leaderboard preserves the result flow
```

## Why keyboard shortcuts are used

Keyboard shortcuts are stable because they are part of the game logic.

Examples:

```text
Enter = start / continue
H = hint
R = reset
S = submit
M = menu
L = leaderboard
V = mute sound
Z = large text
1-6 = card selection
```

This avoids brittle mouse-coordinate tests inside the canvas.

## How to run only Meaning Bridge tests

From the client folder:

```powershell
cd C:\Users\Nawaf\Desktop\word_complex\client
npx playwright test tests/meaning-bridge.spec.js
```

Run headed:

```powershell
npx playwright test tests/meaning-bridge.spec.js --headed
```

Run all E2E tests:

```powershell
npm run test:e2e
```

## Expected result

Current expected result:

```text
15 passed
```

## Maintenance rules

When updating Meaning Bridge, keep these stable unless intentionally updating tests:

```text
- data-testid values
- keyboard shortcuts
- debug state field names
- mocked API contract shape
```

If a UI label or style changes, tests should still pass.

If game logic changes, update the relevant debug assertion or mock response intentionally.

## Future test ideas

Possible next test coverage:

```text
- timed auto-submit when countdown expires
- wrong match increments wrongAttempts
- perfect round result after all pairs are matched
- player name editing inside the ZIMJS setup screen
- full leaderboard rendering expectations
- backend integration tests using the real Express server
- tests for the remaining games once their stable data-testid coverage exists
```

## Current status

Meaning Bridge Playwright coverage is green:

```text
Build: GREEN
Playwright: 15 passed
MIGRATION-04-A: smoke tests GREEN
MIGRATION-04-B: timed/custom timer tests GREEN
MIGRATION-04-C: match/submit/result tests GREEN
```
