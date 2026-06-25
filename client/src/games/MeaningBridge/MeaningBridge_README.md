# Meaning Bridge

Meaning Bridge is the vocabulary-matching game in Word Complex. It uses a ZIM canvas game surface and a React scene shell.

Players connect words to synonyms, antonyms, or definitions. The game supports both untimed Practice mode and Timed Challenge mode.

## Location

```text
client/src/games/MeaningBridge/index.jsx
```

## Game Identity

```text
Game id: meaning-bridge
ZIM id: zim-meaning-bridge
Title: Meaning Bridge
Card number: 02
```

## Modes

Meaning Bridge currently supports three challenge types:

```text
Synonym Bridge
Definition Bridge
Opposite Bridge
```

Each challenge can be played through:

```text
Practice
Timed Challenge
```

## Practice Mode

Practice mode has no countdown timer. Players can complete one or more puzzles and choose when to see final results.

Important behavior:

```text
Header shows Practice and puzzle number
Puzzle completion opens a round-complete screen
Round-complete screen shows accuracy, time, hints, and misses
Player can continue to the next puzzle or see results
Final score can be submitted
```

## Timed Challenge Mode

Timed Challenge mode lets the player solve as many puzzles as possible before the timer expires.

Timer options:

```text
2:00
5:00
10:00
Custom
```

Custom timer input is clamped to:

```text
1 to 60 minutes
```

When the timer expires, the game goes to final score.

## Hint System

Meaning Bridge hints are routed through the background helper character system, not an old in-canvas hint modal.

Expected flow:

```text
Player selects a word on the left
Player presses Hint
Meaning Bridge emits a hint event through sceneBus
The helper character says the hint in a speech bubble
The debug state updates lastHintText
```

The game imports:

```js
import { emit } from "../../scenes/sceneBus";
```

The helper function should update `lastHintText` and then emit the hint:

```js
function emitHelperHint(text, holdMs = 4200) {
  lastHintText = String(text || "");

  emit("hint", {
    text: lastHintText,
    holdMs,
  });

  publishDebugState();
}
```

## Round Completion

After a puzzle is completed, the round-complete screen shows:

```text
Well done!
Puzzle complete
Points earned
Accuracy
Time
Hints
Misses
Next Puzzle
See Results
```

The round result is based on a frozen completion snapshot so time does not continue increasing while the player sits on the completion screen.

## Final Score

The final score screen supports score submission and shows a saved result summary after submit.

Saved Result includes:

```text
Accuracy
Time
Hints
Misses
```

The final score flow also supports opening the leaderboard.

## Exit Confirmation

Exiting active gameplay should not immediately discard progress. The Exit button and Escape key should route through a confirmation screen during:

```text
loading
gameplay
round-complete
```

The confirmation screen offers:

```text
Keep Playing
Exit to Menu
```

## Debug State

Meaning Bridge publishes debug state for development and E2E testing:

```js
window.__meaningBridgeZimDebug
```

Important fields include:

```text
screen
playerName
currentMode
activeChallenge
roundIndex
roundNumber
totalScore
puzzleRoundId
matchedCount
totalPairs
roundHintsUsed
roundWrongAttempts
completedRounds
submittedRounds
isSubmittingScore
scoreSubmitMessage
scoreSubmitError
submittedResultSummary
lastHintText
currentPuzzleResultSummary
playMode
timedSecondsLeft
timedSecondsTotal
timerPreset
customTimerMinutes
selectedTimerSeconds
completedPuzzles
```

## E2E Test Hooks

Meaning Bridge exposes test hooks only in development or E2E mode:

```js
window.__meaningBridgeZimTestHooks
```

The hooks are enabled when one of these is true:

```text
import.meta.env.DEV
import.meta.env.VITE_E2E === "true"
localStorage.meaningBridgeE2E === "1"
```

These hooks are necessary because ZIM renders the game inside a canvas, where normal DOM selectors are not reliable.

## Playwright Tests

The Meaning Bridge Playwright tests live at:

```text
client/tests/meaning-bridge.spec.js
```

Run them from the client directory:

```powershell
cd C:\Users\Nawaf\Desktop\word_complex\client
npm run test:e2e:headed -- tests/meaning-bridge.spec.js
```

Current E2E coverage includes:

```text
Practice setup
Timed setup
Custom timer clamp
Puzzle completion stats
Helper-character hint bubble
Exit confirmation
Final score submit
Saved Result summary
Timed expiry
```

## Development Validation

Recommended validation after Meaning Bridge changes:

```powershell
cd C:\Users\Nawaf\Desktop\word_complex\client
npm run build
npm run test:e2e:headed -- tests/meaning-bridge.spec.js
```

## Notes for Future Work

Good future improvements include:

```text
More leaderboard tests
API failure tests
Keyboard-only flow tests
Multi-puzzle timed accumulation tests
Player-name editing tests
Visual polish checks
Accessibility checks around the React shell
```

The current E2E coverage is enough for the stabilized Practice / Timed / Hint / Exit / Submit milestone.
