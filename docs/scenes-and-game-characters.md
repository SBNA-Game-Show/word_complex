# Scenes and In-Game Characters

This explains the "scene" system: when you launch certain games, you don't just get
a bare canvas. You get a full environment - an illustrated background, and your chosen
character standing beside the game, reacting to how you play. This guide is for the
next cohort who wants to understand it or give a new game its own scene.

## What a scene is

When you start a game, one of two things happens:

- **The game has a scene** - you see a painted background, your buddy standing on the
  right, and a menu "swipe" transition on the way in. The buddy cheers when you get
  something right and gives hints. (Passage Reconstruction, Meaning Bridge, Context
  Cloze Quest, and Word Hunt work this way.)
- **The game has no scene** - it just opens in a plain wrapper (`GameScreen`). Nothing
  breaks; it simply has no environment.

What decides which one you get? A single registry. If a game's id has an entry in
`sceneConfig.js`, it gets the scene treatment. If not, it gets the plain wrapper. That
check lives in `App.jsx` (`getSceneConfig(gameId)`).

## The pieces

Everything for scenes lives in `client/src/scenes/`. Small files, one job each.

| File | Job |
|------|-----|
| `sceneConfig.js` | The registry. One entry per game: which background, where the canvas sits, where the character stands. |
| `GameScene.jsx` | Renders a scene: background + character + the game's canvas + the back button and zoom controls. |
| `CharacterHelper.jsx` | Draws the chosen character in the standing spot and shows the speech bubble. |
| `sceneBus.js` | A tiny event channel so the game (running inside the canvas) can tell the scene "player got it right / wrong / here's a hint". |
| `speechLines.js` | The pool of things the buddy can say for each kind of event. |

## Which character shows up

The character standing in the scene is the one the player picked on the **Choose
Character** screen. If they haven't picked one, the scene falls back to its
`defaultCharacterId` (usually `tomely`). The image comes from
`public/characters/<id>.webp`, the same roster used everywhere else (see
[adding-characters.md](adding-characters.md)).

## How to give a new game a scene

Say you built a new game and you want it to have an environment. Three steps:

1. **Add the background art.** Put a PNG in `client/public/scenes/<name>.png`, then run
   `npm run optimize:images` (from `client/`) to generate the `.webp` the app actually
   ships. See [art-preload-and-loading.md](art-preload-and-loading.md) for why.
2. **Add an entry to the registry.** Open `client/src/scenes/sceneConfig.js` and add an
   entry keyed by your game's `id` (the same id from `client/src/games/index.js`):

   ```js
   "your-game-id": {
     background: "/scenes/your-game.webp", // the art you just optimized
     transitionMs: 750,                    // menu swipe length (keep ~600-900ms)
     backgroundAspect: 1672 / 941,         // width / height of the background image
     canvas: { maxWidth: 1100, side: "left", offsetX: "8%" }, // canvas size + nudge
     character: { side: "right", left: "82%", bottom: "26%", width: "17%", scale: 1 },
     defaultCharacterId: "tomely",
   },
   ```
3. **That's it.** `App.jsx` sees the entry and routes your game through `GameScene`
   automatically. No other wiring.

### What the fields mean

- `background` - the full-screen image path (`/scenes/...webp`).
- `transitionMs` - how long the menu swipes away before the scene appears.
- `backgroundAspect` - the width/height of the background image. This is what keeps the
  character glued to the same spot on the artwork on any screen size, so set it to the
  real dimensions of your image (there is a comment noting the current art is
  1672 x 941).
- `canvas.maxWidth` - caps how wide the game canvas can get. `offsetX` nudges it right.
- `character` - where the buddy stands. The values are relative to the **background
  art**, not the screen: `left` and `bottom` place the feet, `width` scales the buddy
  with the art, `scale` is an extra multiplier. Tweak these until the character looks
  like it is standing on the painted ground.
- `defaultCharacterId` - who stands there if the player hasn't chosen a buddy.

## Making the character react to the game

The game runs inside an isolated ZIM canvas, so it can't call the character directly.
Instead it sends little events on `sceneBus`, and the scene turns them into speech.

From inside your game code:

```js
import { emit } from "../../scenes/sceneBus";

emit("correct");                       // buddy says a random cheer
emit("wrong");                         // buddy says a random "try again"
emit("hint", { text: "Try the blue cloud next" }); // buddy says this exact line
```

The moods you can send (and where the words come from) live in `speechLines.js`:
`correct`, `wrong`, `roundOver`, `complete`, `timeUp`, and `hint`. For most moods the
buddy picks a random line from the pool. For `hint`, pass the exact `text` you want
(hints are specific), and it stays on screen longer so the player can read it. You can
also override how long any bubble lingers with `emit("correct", { holdMs: 2500 })`.

To add or reword what the buddy says, edit the pools in `speechLines.js`.

## Quick reference

| I want to... | Do this |
|--------------|---------|
| Give a game an environment | Add art + a `sceneConfig.js` entry keyed by the game id |
| Move the character | Tune `character.left/bottom/width/scale` in `sceneConfig.js` |
| Make a bigger/smaller canvas | Change `canvas.maxWidth` / `offsetX` |
| Make the buddy react | `emit("correct" | "wrong" | "hint", ...)` from the game |
| Change what the buddy says | Edit the pools in `speechLines.js` |

## Things worth knowing

- The scene id **must match** the game's id in `client/src/games/index.js`, or the
  scene won't attach.
- The art **filename** does not have to match the id. For example the game
  `context-cloze-quest` uses `/scenes/context-cloze.webp`. Just make sure the
  `background` path in the config points at the real file.
- Character positions are relative to the **background image**, so if you swap in art
  with a different shape, update `backgroundAspect` too or the buddy will drift.
- A game with no `sceneConfig.js` entry still works - it just uses the plain
  `GameScreen` wrapper with no environment.
