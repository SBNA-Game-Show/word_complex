# Context Cloze Quest (client side)

Context Cloze Quest is the fill-in-the-blank game. The player chooses a language, one or more word types, and a difficulty level, then drags words from the word bank into blanks inside a passage.

The game supports English and Sanskrit and is rendered entirely inside a ZIMJS canvas.

## Canvas architecture

The implementation lives primarily in:

```text
client/src/games/ContextClozeQuest/index.jsx
```

The game is exported through `createZimGame(...)`, which mounts a ZIM canvas inside the React application. React remains the platform shell; the player-facing menu, passage, blanks, draggable words, timer, hints, feedback, controls, and results are all controlled by ZIM.

Public and internal identifiers:

```text
Launcher game id: context-cloze-quest
ZIM holder id:   zim-context-cloze-quest
Canvas size:     1100 × 800
```

The `setup(...)` callback receives the ZIM stage, dimensions, library object, and authenticated user. Its returned cleanup function stops the active timer, clears development/E2E globals, and removes the stage contents when the player leaves the game.

## Menu and round setup

The menu lets the player choose:

- language: English or Sanskrit;
- word types: noun, verb, and adjective;
- difficulty: easy, medium, or hard.

At least one word type must remain selected.

The default menu state is:

```text
Language:   English
Word type:  Noun
Difficulty: Easy
```

Selecting **Let's Play** calls the existing `startGame()` path and requests a new board using the current selections.

## Game API contract

The game calls:

```text
GET /api/v1/fillInBlanks
```

through:

```text
client/src/services/FillInTheBlankFrontendService.js
```

The request query contains:

```text
language
wordTypes
difficulty
storyId
```

Client word-type values are mapped before the request:

```text
noun       -> NOUN
verb       -> VERB
adjective  -> ADJ
```

`storyId` comes from the story selected earlier in the Story Picker.

A successful response provides:

```js
{
  success: true,
  data: {
    id,
    originalParagraph,
    paragraph,
    answers,
    wordBank
  }
}
```

`paragraph` contains `_____` markers. The client converts those markers into live ZIM blank containers and renders each `wordBank` entry as a draggable ZIM button.

The current production request path does not render a separate player-facing load-error screen. A rejected request must not fabricate a gameplay board; adding a dedicated retry/error surface would be a separate product change.

## Drag-and-drop behavior

Each word button remembers:

```text
homeX
homeY
word
blankIndex
```

Each blank remembers:

```text
index
filledWord
```

The existing production drag handlers enforce these rules:

- dropping a word into a blank snaps and scales it into that blank;
- moving a placed word to another blank clears its earlier blank;
- dropping a second word into an occupied blank returns the earlier word home;
- dropping a placed word outside all blanks clears the placement and returns it home;
- a submitted round disables word movement.

The Playwright suite includes one real mouse drag against the visible canvas and deterministic command coverage that invokes these same production handlers.

## Difficulty and timer rules

The countdown is selected from the active difficulty:

| Difficulty | Time limit |
|---|---:|
| Easy | 60 seconds |
| Medium | 90 seconds |
| Hard | 120 seconds |

The perfect-answer time bonus is:

```text
2 points × remaining whole seconds
```

When the countdown reaches zero, production behavior currently:

- stops the timer;
- displays `⏰ Time is up!`;
- emits the existing wrong-answer scene event;
- leaves the round unsubmitted and its controls unlocked;
- permits the player to finish afterward with no remaining-time bonus.

That behavior is verified as the current contract. Changing timeout to auto-submit or lock the board would be a separate gameplay decision.

## Hints

Each round allows:

```text
Maximum hints: 2
Penalty:       25 points per used hint
```

`applyHint()` finds the first blank that is not already correctly solved and has not already been hinted. It emits a scene hint containing the first letter of the correct word.

A hint is not spent when:

- the round is already submitted;
- no hint remains;
- every unresolved target has already been hinted;
- all blanks are already correctly solved.

The shared hint button triggers the game-owned `applyHint()` function; it does not implement the hint rule itself.

## Submission and scoring

The Submit Answer handler counts:

```text
filled blanks
correct blanks
total questions
hints used
remaining time
```

Answer score:

```text
100 points × correct answers
```

Perfect bonus:

```text
2 points × remaining seconds
```

The perfect bonus is granted only when every answer is correct.

Final score:

```text
max(0, answer score + perfect bonus - hint penalty)
```

Submission behavior:

- incomplete board: warning is shown; timer and controls remain active;
- complete and perfect: final score is shown; timer stops; round locks;
- complete and imperfect: final score is shown; timer stops; round locks;
- repeated submissions after a completed round are ignored.

## Leaderboard score submission

Guests never submit leaderboard scores.

A signed-in completed round posts to:

```text
POST /api/v1/fillInBlanks/score
```

Payload:

```js
{
  uuid,
  displayName,
  score,
  bestTime,
  storyId,
  difficulty
}
```

`bestTime` is elapsed time in milliseconds:

```text
difficulty time limit - remaining time
```

A score-save failure is logged, but the already-rendered completed result remains visible and locked.

## Reset and Menu

**Reset Game**:

- stops the current timer;
- starts a fresh request with the current menu selections;
- creates a new round with fresh placements, hints, score text, feedback, and timer state.

**Menu**:

- stops the active timer;
- invalidates the current request/run identifier;
- clears the active board;
- preserves the current language, difficulty, and word-type selections.

A delayed response from an abandoned run is ignored.

## Development/E2E canvas bridge

Normal DOM locators cannot inspect the internal objects of a ZIM canvas. The game therefore contains a narrowly gated browser bridge for Playwright.

Globals:

```text
window.__contextClozeQuestZimDebug
window.__contextClozeQuestZimTestHooks
```

The bridge is available only when one of these conditions is true:

```text
Vite development mode
VITE_E2E=true
localStorage.contextClozeQuestE2E === "1"
```

Every bridge block is marked with an adjacent comment such as:

```text
E2E TEST HOOKS
E2E TEST STATE
E2E TEST GEOMETRY
E2E COMMAND
E2E TEST HOOK CLEANUP
```

The bridge:

- publishes existing menu and round state;
- reads live ZIM geometry for words and blanks;
- invokes existing production handlers for placement, release, hints, submission, Reset, and Menu;
- exposes deterministic timer setup for browser tests;
- does not reproduce scoring, hint, placement, timeout, or submission rules;
- is removed when the game unmounts.

The Playwright implementation and evidence are documented in:

```text
client/tests/docs/README_CONTEXT_CLOZE_QUEST_e2e_TESTS.md
```
