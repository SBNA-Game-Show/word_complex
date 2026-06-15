# Client End-to-End Testing Guide

This folder contains Playwright end-to-end tests for the client application.

The goal of these tests is to verify important user flows from the browser's point of view while keeping selectors stable as the UI changes. Following Jacob's guidance, tests should prefer `data-testid` attributes instead of fragile selectors based on CSS classes, text positioning, or visual layout.

## Location

```text
client/
  playwright.config.js
  tests/
    README_e2e.md
    README_MEANING_BRIDGE_e2e_TESTS.md
    meaning-bridge.spec.js
```

## Running the tests

From the client folder:

```powershell
cd C:\Users\Nawaf\Desktop\word_complex\client
npm run test:e2e
```

Run with the browser visible:

```powershell
npm run test:e2e:headed
```

Run with the Playwright UI:

```powershell
npm run test:e2e:ui
```

Build check:

```powershell
npm run build
```

## Playwright configuration

The project uses:

```text
client/playwright.config.js
```

The config starts the Vite development server automatically and runs tests against:

```text
http://127.0.0.1:5173
```

The config also sets:

```js
testIdAttribute: "data-testid"
```

This lets tests use:

```js
page.getByTestId("some-stable-id")
```

## Selector strategy

Use stable test IDs for regular DOM elements:

```jsx
<input data-testid="username-input" />
<button data-testid="login-button" />
<section data-testid="canvas-shell-meaning-bridge" />
```

This is preferred because CSS classes, layout, button text, and styling can change without breaking the tests.

Avoid selectors like these unless there is no better option:

```js
page.locator(".some-css-class")
page.getByText("Exact text that may change")
page.mouse.click(400, 300)
```

## Canvas-based games

Some games, especially Meaning Bridge, render their gameplay inside a ZIMJS canvas. Playwright can see the canvas holder, but it cannot directly select individual ZIMJS cards and buttons because they are drawn inside the canvas, not represented as normal HTML elements.

For canvas games, use this strategy:

```text
1. Use data-testid for the outer React/DOM wrapper.
2. Use keyboard shortcuts for game actions.
3. Use a stable debug object for state assertions.
```

Meaning Bridge exposes:

```js
window.__meaningBridgeZimDebug
```

This allows tests to assert stable game state without relying on fragile canvas coordinates.

## API mocking

The Meaning Bridge tests currently mock the API routes used by the game:

```text
POST /api/v1/meaningBridge/generate
POST /api/v1/meaningBridge/submit
GET  /api/v1/meaningBridge/leaderboard
```

This keeps the client E2E tests stable and independent from MongoDB or the Express backend.

## What these tests are meant to catch

The E2E tests should catch issues such as:

```text
- Login flow breaking
- Game launcher navigation breaking
- The ZIMJS game not mounting
- Keyboard shortcuts breaking
- Setup flow breaking
- Timer setup breaking
- Round start breaking
- Match state breaking
- Submit/result flow breaking
- Leaderboard navigation breaking
```

## What these tests are not meant to do

These tests are not a replacement for backend unit tests. They do not fully validate the real dictionary, real passage extraction, real database persistence, or all scoring edge cases.

Those should be covered by backend tests and later integration tests.

## Current status

Current Meaning Bridge Playwright coverage:

```text
Smoke tests: GREEN
Timed/custom timer tests: GREEN
Match/submit/result tests: GREEN
Total: 15 passing tests
```

## Recommended workflow

Before making frontend changes:

```powershell
npm run build
npm run test:e2e
```

After changing Meaning Bridge or shared game shell code:

```powershell
npm run build
npm run test:e2e
```

If a Playwright test fails, check:

```text
client/test-results/
```

Playwright stores screenshots, traces, and error context there when available.
