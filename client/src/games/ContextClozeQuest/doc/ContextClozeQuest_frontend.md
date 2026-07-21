# Context Cloze Quest: Frontend

> Last verified: 2026-07-21.

## Entry point and registration

The game is implemented in `client/src/games/ContextClozeQuest/index.jsx`. It exports:

- `meta`, used by the launcher (`id`, card number, artwork, title, and description).
- A default React component created by `createZimGame()`.

`client/src/games/index.js` registers the component. The wrapper in `createZimGame.jsx` creates a ZIM `Frame`, waits for fonts, passes `stage`, dimensions, ZIM, and application props to `setup()`, and disposes canvas resources when React unmounts it.

The game canvas is 1100 by 800 and uses ZIM for all menu and gameplay controls. React is only the lifecycle/container layer.

## Internal state

State is held in closures rather than React state because the interactive UI is a ZIM scene.

| Value | Purpose | Initial value |
| --- | --- | --- |
| `selectedLanguage` | Story version and content font | `english` |
| `selectedWordTypes` | Parts of speech sent to the API | `['noun']` |
| `selectedDifficulty` | Blank count and timer | `easy` |
| `gameRunId` | Rejects results/timers from an obsolete round | `0` |
| `disposed` | Prevents updates after unmount | `false` |
| `timerInterval` | Current countdown interval | `null` |

Per round, `blanks` stores blank containers and `wordButtons` stores draggable choices. A word button's `blankIndex` and a blank's `filledWord` connect the two.

## Main functions

### `showMenu()`

Clears the timer and stage, draws the menu, and updates language, word-type, and difficulty selection. At least one word type must remain selected.

### `startGame()`

Creates a new run ID, draws the gameplay shell, requests puzzle data, lays out the passage and word bank, installs drag/drop handlers, starts the timer, and creates reset, hint, and submit controls.

### `drawParagraphWithInlineBlanks()`

Splits the API's `paragraph` on the literal marker `_____`, wraps words to fit the passage, and inserts indexed ZIM blank containers between text segments. The order of these blank indexes must match the API's `answers` array.

### `applyHint()`

Finds the first unsolved, unhinted blank and emits a scene hint containing the answer's first uppercase character. Each useful hint consumes one of two available hints.

### Submit handler

Counts filled and correct blanks, calculates the final score, locks a submitted round, emits scene feedback, and submits eligible users' scores to the backend. See the gameplay document for the formula.

## Shared dependencies

| Dependency | Role |
| --- | --- |
| `createZimGame` | Owns frame creation and teardown, including React Strict Mode protection |
| `sceneBus.emit` | Sends `hint`, `complete`, and `wrong` events to the surrounding scene |
| `getFillInBlanks` | Builds and performs the puzzle request |
| `createHintPolicy` | Tracks remaining hints and exposes the per-hint penalty |
| `createHintButton` | Renders the reusable ZIM hint control |
| `getSelectedStoryId` | Reads the story chosen for this browser session |
| `submitContextClozeQuestScore` | Posts a finished score |

## Fonts and language

- Most interface text uses `Fredoka`.
- Sanskrit passage content and the Sanskrit menu label use `Nirmala UI`.
- The API language values are `english` and `sanskrit`.
- Frontend word types map to server POS tags: `noun -> NOUN`, `verb -> VERB`, `adjective -> ADJ`.

## Layout behavior

The word bank uses six choices per row. Its height grows with the number of rows, which reduces the available passage-card height. Passage content is placed inside a masked, scrollable ZIM container. Dragged words are re-parented between the main stage and the passage container; coordinate conversion is necessary whenever this occurs.

When changing drag/drop behavior, preserve the `localToGlobal()` then `globalToLocal()` conversion. Omitting it makes a button jump when its parent changes.

## Lifecycle and asynchronous safety

- `gameRunId` changes when returning to the menu or starting/resetting a round.
- The puzzle promise checks both `disposed` and its captured run ID before drawing.
- Cleanup increments the run ID, clears the timer, removes stage children, and updates the stage.
- `createZimGame` additionally disposes the frame and removes remaining canvases.

Any new promise, timeout, interval, animation callback, or event listener should follow the same lifecycle pattern.

## Adding or changing UI behavior

1. Decide whether the behavior belongs to the game or a reusable `games/shared` helper.
2. Create ZIM objects only after the frame is ready in `setup()`.
3. Re-render the stage with `stage.update()` after synchronous visual changes.
4. Clear resources during menu transitions and cleanup.
5. If API fields change, update the API document and both client/server code together.
6. Test at all three difficulties and in both languages; these produce different passage and word-bank sizes.

## Current frontend cautions

- `getFillInBlanks()` has no `.catch()` or visible loading/error view in the game. A failed request can leave the player on a mostly empty gameplay screen.
- The initial fallback `words` and `correctAnswers` values are overwritten but are not used to render a playable fallback.
- The timer reports time-up but does not lock the round. A player can still arrange and submit words afterward, with no time bonus.
- Score correctness and score values are trusted from the browser by the score endpoint.
- Most behavior lives in one large file. When refactoring, extract cohesive helpers without introducing React state for objects owned by ZIM.

