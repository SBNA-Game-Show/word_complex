# Adding Hints to Your Game

This is a guide for wiring the hint system into **any** of our games — matching, fill-in-the-
blank, find-the-word, synonyms, adjectives, whatever your group is building. It already works in
Passage Reconstruction (`PassageReconstruction`), which is the reference implementation. The whole
point of how it's built is that you only write **one small function** for your game; everything
else is shared code you plug into.

Your game's data is different from everyone else's, and that's fine — the shared parts (the
counter, the button, the talking character) don't care what your puzzle looks like. The only
piece that touches your data is your `applyHint`, and the [recipes section](#writing-applyhint-for-your-game-recipes)
below has a worked example for each kind of game we have.

## The idea

There are three moving parts, and two of them are already done for you:

1. **The policy** — counts how many hints are left and what each one costs. Shared, you don't
   touch it.
2. **The button** — the in-canvas "Hint (2)" button the player clicks. Shared, you don't touch
   it.
3. **The hint itself** — what actually happens when they click. *This* is the part only you can
   write, because only your game knows what a helpful nudge looks like for your puzzle.

When the player clicks the button, your function runs, does its thing on the board, and then
fires off `emit("hint", { text })`. That last line is what makes the helper character pop up
and "say" the hint. The button doesn't know about the character, and the character doesn't know
about the button — they only talk through that one event. That's why this drops into any game
cleanly.

> Heads up: the character speaking only happens in games that run inside a scene (have an entry
> in `scenes/sceneConfig.js`). All four current games do, so you're fine. If a game ever runs
> without a scene, the button and reveal still work — there's just no character to say the line.

## The five steps

Everything below happens inside your game's `setup({ frame, stage, W, H, zim })` function.

### 1. Import the two shared helpers

```js
import { createHintPolicy } from "../shared/hintPolicy";
import { createHintButton } from "../shared/hintButton";
```

(Adjust the `../shared/` path to match where your game file sits.)

Your game almost certainly already imports `emit` from `scenes/sceneBus` — it's what the
character-feedback events use (`emit("correct")`, etc.). You'll reuse that same `emit` for hints,
so there's nothing new to add. If for some reason it's missing, it's
`import { emit } from "../../scenes/sceneBus";`.

### 2. Make a policy and a slot for the button

Put this near your other state variables (score, round index, etc.):

```js
const hintPolicy = createHintPolicy({ maxPerRound: 2, penalty: 25 });
let hintButton = null;
```

`maxPerRound` is how many hints they get each round; `penalty` is how many points each one
costs. Pick whatever feels fair for your game — you can tune these anytime.

### 3. Write your `applyHint()` — the only real work

This is your game's brain for "what's the most useful next nudge?" It looks at your own state,
figures out the next thing the player needs, and tells the character what to say. Here's the
actual Passage Reconstruction version — yours will differ in the middle:

```js
function applyHint() {
  if (feedbackActive) return;        // your own "is a popup showing?" flag — see note
  if (!hintPolicy.canUse()) return;  // out of hints this round

  // --- YOUR GAME-SPECIFIC PART ---
  // Work out the next piece the player still needs. Don't touch the board — just
  // find what to say. For Passage Reconstruction: the first slot that's empty or
  // holds the wrong phrase.
  const answer = rounds[roundIndex].answer;
  let target = -1;
  for (let i = 0; i < zones.length; i++) {
    if ((zones[i].tile?.chunk ?? null) !== answer[i]) { target = i; break; }
  }
  if (target === -1) return;  // nothing helpful left to say — DON'T spend a hint
  // --------------------------------

  hintPolicy.use();                                   // spend one hint
  score = Math.max(0, score - hintPolicy.penalty);    // apply the cost
  if (hintButton) hintButton.refresh();               // update the "(N)" counter
  emit("hint", { text: `"${answer[target]}" goes in slot ${target + 1}.` }); // buddy says it
}
```

We deliberately keep it simple: the hint **tells** the player what to do, it doesn't move pieces
for them. That sidesteps a whole class of headaches (revealed pieces getting bumped, locked, or
out of sync with the board) and keeps the player in control. You *can* make your hint physically
place/highlight something if it really helps your game — but then you own keeping the board
consistent, and you'd call `stage.update()` at the end to redraw. For most games, just telling
them is enough.

A couple of things in that snippet are **yours, not the hint system's**: `feedbackActive` is just
PassageReconstruction's flag for "a result popup is on screen right now," and `score` is its own score
variable. Use whatever your game calls these — or drop the `feedbackActive` line entirely if your
game has no such state. The only lines that *must* be there are the `hintPolicy` calls, the
`hintButton.refresh()`, and the `emit("hint", …)`.

The exact `text` you pass is whatever's genuinely helpful for your puzzle — name the word, point
at a spot, whatever. Keep it short; it's a speech bubble. The loop above is the Passage
Reconstruction shape; **for your game's data, jump to the
[recipes](#writing-applyhint-for-your-game-recipes) below** — there's one for matching games,
fill-in-the-blank, and find-the-word.

Two rules that keep it honest:

- **Bail out early if you can't actually help.** If the board's already solved or there's nothing
  useful to say, `return` *before* `hintPolicy.use()`. Otherwise you charge the player for nothing.
- **Only spend the hint once you know you have something to say.** Order matters: figure out the
  nudge first, then `use()`, `penalty`, `refresh()`, `emit()`.

### 4. Drop the button onto the board

Wherever you build your buttons (Check, Reset, etc.), add this:

```js
hintButton = createHintButton({
  stage,
  zim,
  x: 900,            // wherever it fits next to your other buttons
  y: 674,
  policy: hintPolicy,
  onUse: applyHint,
  palette: { bg: palette.gold, color: palette.ink },  // optional, match your colors
});
```

If you rebuild your controls every round (most games do), that's fine — the button gets rebuilt
with them, and because `hintButton` is reassigned each time, `applyHint`'s `refresh()` always
points at the live one.

### 5. Refill hints at the start of each round

Call this once, at the top of whatever function kicks off a new round (the preview screen, the
"next round" handler — wherever a fresh round truly begins):

```js
hintPolicy.reset();
```

**Don't** put this in your "redraw the board" function if your Reset button also calls that —
otherwise hitting Reset would hand the player free hints back. Reset should clear the board but
keep spent hints spent. New *round* refills; Reset doesn't. In Passage Reconstruction the reset
lives at the top of `showSentencePreview()` for exactly this reason.

## Writing `applyHint` for your game (recipes)

Every game's hint boils down to the same three beats, no matter the data:

1. **Find the next thing the player hasn't solved yet** — the next empty blank, the next unmatched
   word, the next adjective they haven't found.
2. **Say something useful about it** — how much you give away is your call (see "How strong?"
   below).
3. **Spend the hint and emit it** — the same four lines every game ends with
   (`use()` → `penalty` → `refresh()` → `emit("hint", { text })`).

Only beat 1 and the wording in beat 2 depend on your data. Here's how that looks for each kind of
game we have. Find the one closest to yours and adapt the variable names.

### Don't repeat the same hint

Since a hint just *talks* (it doesn't fill anything in), the board doesn't change between presses
— so "the next unsolved thing" can be the same thing twice in a row. The fix we use in Passage
Reconstruction: keep a `Set` of what you've already pointed at this round and skip it.

```js
const hintedKeys = new Set();        // declare near hintPolicy
// ...inside applyHint, when picking the target, skip ones already hinted:
if (!solved && !hintedKeys.has(key)) { target = key; break; }
// ...and once you commit to a hint:
hintedKeys.add(target);
// ...and clear it in step 5, right next to hintPolicy.reset():
hintedKeys.clear();
```

### How strong should a hint be?

You decide how much to give away — and you can make later hints more generous than earlier ones.
A few options, from gentle to obvious:

- **Category / location:** "There's still an adjective in the second sentence."
- **First letter:** `needs a word starting with "${word[0].toUpperCase()}"`.
- **The whole answer:** `"${word}" goes in blank 2.`

Gentle hints for a smaller penalty, full answers for a bigger one, is a nice pattern if you want
it — but start simple and tune later.

### Recipe A — Matching games (synonyms, antonyms, definitions, Sanskrit…)

This is the Meaning Bridge shape: a round has `leftItems` (the words), `rightItems` (the
meanings/synonyms/antonyms — whatever the mode is), an `answerKey` mapping each left id to its
correct right id, and a `matches` array of what the player's paired so far. The same code works
for *every* mode, because the mode is already baked into `answerKey`/`rightItems`.

```js
function applyHint() {
  if (!hintPolicy.canUse()) return;
  const puzzle = roundData?.puzzle;
  if (!puzzle) return;

  // First word the player hasn't matched yet.
  const left = puzzle.leftItems.find(
    (item) => !matches.some((m) => m.leftId === item.id) && !hintedKeys.has(item.id)
  );
  if (!left) return;                       // nothing left to help with

  // Its correct partner, via the answer key.
  const rightId = puzzle.answerKey[left.id];
  const right = puzzle.rightItems.find((r) => r.id === rightId);

  hintedKeys.add(left.id);
  hintPolicy.use();
  score = Math.max(0, score - hintPolicy.penalty);
  hintButton.refresh();
  // Bonus: Meaning Bridge already ships per-word hint text — prefer it if present.
  emit("hint", {
    text: puzzle.hints?.[left.id] || `"${left.label}" pairs with "${right.label}".`,
  });
}
```

Note the `puzzle.hints?.[left.id]` line: if your round data already carries hand-written hints
(Meaning Bridge's does), just feed that straight to the character instead of building your own
sentence.

### Recipe B — Fill-in-the-blank (Context Cloze Quest)

Here a round has `correctAnswers` (the right word for each blank, in order) and draggable
`wordButtons` that each remember which blank they're sitting in (`blankIndex`). A blank is solved
when the button in it holds the matching word.

```js
function applyHint() {
  if (!hintPolicy.canUse()) return;

  // First blank that isn't filled with its correct word yet.
  let target = -1;
  for (let i = 0; i < correctAnswers.length; i++) {
    const solved = wordButtons.some((b) => b.blankIndex === i && b.word === correctAnswers[i]);
    if (!solved && !hintedKeys.has(i)) { target = i; break; }
  }
  if (target === -1) return;

  const word = correctAnswers[target];
  hintedKeys.add(target);
  hintPolicy.use();
  score = Math.max(0, score - hintPolicy.penalty);
  hintButton.refresh();
  // Giving the first letter instead of the whole word keeps it a *hint*, not an answer key.
  emit("hint", { text: `Blank ${target + 1} starts with "${word[0].toUpperCase()}".` });
}
```

### Recipe C — Find-the-word (Word Hunt: nouns, verbs, adjectives)

The player hunts for words of a type inside a passage. You'll have some list of target words for
the current round and a record of which ones are already found — the exact variable names differ
per page, so treat these as illustrative.

```js
function applyHint() {
  if (!hintPolicy.canUse()) return;

  // The targets of this type the player still hasn't found.
  const remaining = targetWords.filter((w) => !foundWords.has(w) && !hintedKeys.has(w));
  if (remaining.length === 0) return;

  const word = remaining[0];
  hintedKeys.add(word);
  hintPolicy.use();
  score = Math.max(0, score - hintPolicy.penalty);
  hintButton.refresh();
  emit("hint", { text: `There's still an adjective starting with "${word[0]}".` });
}
```

Swap "adjective" for whatever type that page is hunting. If your targets carry their position in
the passage, an even nicer hint points there: `"…an adjective near the word 'forest'."`

## That's it

Five steps, and only step 3 is real thinking. To sanity-check, run the game and confirm:

- The button shows `Hint (2)` and ticks down to `(1)`, `(0)`, then greys out.
- Clicking it makes the character speak something genuinely useful.
- Your score drops by the penalty each time.
- A new round refills the count; hitting Reset does not.
- Clicking Hint when there's nothing useful to say doesn't cost anything.

If you get stuck, open `client/src/games/PassageReconstruction/index.jsx` and search for `applyHint`,
`hintPolicy`, and `createHintButton` — it's all wired up there to copy from.

## Quick reference

**`createHintPolicy({ maxPerRound, penalty })`**
- `canUse()` → are there hints left?
- `use()` → spend one (returns false if none left)
- `remaining()` → how many are left
- `reset()` → refill (call on a new round)
- `penalty` → the point cost (you subtract it yourself)

**`createHintButton({ stage, zim, x, y, policy, onUse, palette? })`**
- `refresh()` → re-read the count and update the label (call after spending a hint)
- `destroy()` → remove it (rarely needed; rebuilding controls handles it)

**`emit("hint", { text })`** (from `scenes/sceneBus`) → makes the helper character say `text`.
Hints stay on screen for 5 seconds (vs. ~1.6s for normal reactions) so there's time to read
them. Need a different length for one message? Pass `holdMs`: `emit("hint", { text, holdMs: 7000 })`.
