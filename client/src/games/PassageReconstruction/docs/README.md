# Passage Reconstruction (client side)

This is the "rebuild the passage" game. The player is shown a sentence, it disappears, and they have to put it back together by dragging phrase clouds into numbered slots in the right order. It works in both English and Sanskrit.

Almost everything lives in one file, `index.jsx`. It's long, but it's one game, so keep it here rather than splitting it into a dozen tiny files that you'd have to jump between to follow a single round.

## It's a canvas game, not regular React

This game is drawn on an HTML canvas using ZIM, not with normal React components and CSS. So you won't find JSX or divs in here. Instead there's one big `setup` function that draws everything, listens for drags and clicks, and redraws the screen as the round changes.

The file exports the game through `createZimGame(...)`, which is the shared wrapper that mounts a ZIM canvas inside a React component for us. It hands `setup` a few things to work with: the ZIM `stage` (the canvas you draw onto), the width and height, and the `zim` library itself. Whatever `setup` returns is a cleanup function that runs when the player leaves, which is where we stop the timer and wipe the canvas.

## How a game plays out

1. Pick a language. The player chooses English or Sanskrit first.
2. Load the story. We ask the server for a game (see below), which comes back as a set of rounds. Each round has the full sentence, the phrase pieces, and the correct order.
3. Memorise the sentence. Before each round the whole sentence shows for about a second and a half with a little progress bar filling up. The clock is paused here so reading time is free.
4. Arrange the clouds. The sentence vanishes and its phrases appear as clouds scattered below a row of numbered slots. The player drags each cloud into a slot.
5. Check. When all the slots are filled they hit Check. Right, and they move on. Wrong, and they lose an attempt and some points.

Solve every round, or run out the clock, and you land on the results screen.

## Scoring and the rules

- A correct round is worth 100 points.
- A wrong Check costs 20 points and burns one of the round's 3 attempts. Run out of attempts and the round resets so they can try again.
- Hints cost 25 points each, and there are 2 per round. A hint asks the on screen buddy to say where one phrase belongs.
- Points never go below zero, so a struggling player is never in the negative.
- There's one 90 second clock for the whole game, not per round. When it runs out the game ends wherever the player is.

The results screen shows the final score, how many rounds were right versus missed (rounds they never reached count as missed), and an accuracy percentage. "Play Again" sends them back to the language picker.

## Where the story comes from

The rounds are fetched by `getPassageReconstructionGame(language)` in `src/services/passageReconstructionService.js`. That call sends two things to the server: the language, and the story the player picked earlier (the picker stores it, and the service reads it at request time). The server stays stateless and just answers with rounds shaped like `{ sentence, chunks, answer }`.

If the fetch fails or comes back empty, the game shows a "Failed to load story, please refresh" message instead of breaking.

## The buddy reacts to what you do

Throughout the game we call `emit(...)` from the scene bus with things like `correct`, `wrong`, `hint`, `complete`, and `timeUp`. That's how the character standing in the scene knows to cheer, look sympathetic, or read out a hint. This game doesn't draw the buddy itself, it just announces what happened and the scene layer handles the reaction.

## The parts that look fussier than they are

A few bits of this file are more involved than the rest, so here's why they exist before you go trying to simplify them:

- Cloud sizing. Clouds have to grow to fit their phrase, and a cloud's real usable area is only the fat middle band (the top and bottom taper off into puffs). So a multi line phrase needs a cloud that's quite a bit taller than the text, or the words spill onto the wispy edges. That's what all the ratio and min/max constants near the top are about. The sizes are also capped so four clouds always fit across and two rows of scattered clouds still fit below the slots.
- The timer lives on the frame's ticker, not the stage. We wipe the whole canvas between rounds, and if the clock lived on the canvas it would get wiped too. Putting it on the frame's ticker keeps it counting across rounds.
- `feedbackActive` and `gameOver` flags. These block input at moments where it would cause trouble, for example clicking Check again while a "correct" popup is still animating, or the clock running out while a wrong answer popup is mid dismiss. They're small guards that prevent the screen from drawing two things on top of each other.

## One naming thing to know

The game's public id, the one the launcher uses, is `sentence-builder` (see the `meta` export at the bottom). The internal ZIM id is `zim-sentence-game`. They're different for historical reasons. If you're wiring this game up somewhere, `sentence-builder` is the one you want.

## Playwright E2E testing

Passage Reconstruction has a deterministic Playwright gameplay suite:

```text
client/tests/passage-reconstruction.spec.js

Its supporting fixtures live at:

client/tests/helpers/passage-reconstruction-fixtures.js

Because the game is rendered entirely inside a ZIM canvas, normal DOM selectors
cannot reliably inspect its language controls, phrase clouds, numbered slots,
feedback, timer, or results screens.

index.jsx therefore exposes a development/E2E-only bridge:

window.__passageReconstructionZimDebug
window.__passageReconstructionZimTestHooks

The bridge is enabled only during development, when VITE_E2E=true, or when the
local Passage Reconstruction E2E flag is explicitly enabled. It does not replace
the game's scoring, checking, hint, timer, results, or score-submission logic.

The test commands arrange the live ZIM objects and invoke the same production
functions used by the game. One focused test also performs a real Playwright
mouse drag against the rendered canvas and verifies the production snap logic.

The bridge publishes:

current screen and message
language and round state
score, checks, and attempts
hint usage and hint text
timer state
phrase-cloud and slot geometry
placed phrases
final result summary

Both bridge globals are removed when the game unmounts so later scenes cannot
observe stale Passage Reconstruction state.

Full testing documentation:

client/tests/docs/README_PASSAGE_RECONSTRUCTION_e2e_TESTS.md
```
