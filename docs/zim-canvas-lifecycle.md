# ZIM Canvas: Zoom and Clean Teardown

The games are drawn on a canvas using ZIM (a library on top of HTML canvas). Two things
matter for making them behave inside a React app: letting players **resize** the canvas,
and **cleaning up** properly when a game closes so it doesn't leave stale timers or a
dead canvas behind. This covers both.

## The zoom controls (resize buttons)

Every game shows a small `- 100% + Reset` pill so players can make the canvas bigger or
smaller. It is one shared hook: `client/src/components/useCanvasZoom.jsx`.

Key things about it:

- It returns `zoom` (1 = 100%) and a ready-made `controls` pill you just drop into the
  page. Both game wrappers (`GameScreen` and `GameScene`) use it.
- It resizes the canvas **purely in CSS** (via a `--canvas-zoom` variable). It does
  **not** touch ZIM's internal coordinates or any game logic, so gameplay is unaffected.
- The chosen level is saved to `localStorage` (`wc:canvasZoom`) and shared across every
  game and page, so it is remembered between sessions.
- Limits are 50% to 200% in 10% steps (constants at the top of the file).

If you build a new wrapper and want the zoom pill, call `useCanvasZoom()`, render
`controls`, and apply `zoom` to a canvas ancestor as the `--canvas-zoom` CSS variable.
You usually get this for free by using `GameScene` or `GameScreen`.

## The lifecycle helper (clean mount and teardown)

Games do not create their own ZIM `Frame`. They use a helper,
`client/src/games/createZimGame.jsx`, and only provide a `setup` function. The helper
owns the whole lifecycle:

- **On mount**: it creates one ZIM `Frame` and calls your `setup`.
- **On unmount**: it disposes the Frame, clears the canvas, and empties the holder.

This is what stops the two classic bugs: duplicate canvases when you re-enter a game,
and stale timers that keep running after a game closes.

### The rule for game authors

If your `setup` starts anything that keeps running - a `setInterval`, a countdown, a ZIM
ticker, an event listener - you must stop it when the game closes. You do that by
**returning a cleanup function from `setup`**:

```js
setup({ frame, stage, W, H, zim, isDisposed }) {
  const timer = setInterval(tick, 1000);

  // ...build your game...

  // Return a cleanup. The helper calls this on unmount, before it disposes
  // the Frame.
  return () => {
    clearInterval(timer);
  };
}
```

The helper also gives you `isDisposed()`. If you do async work (like waiting on a fetch
or a font), check `isDisposed()` before touching the stage, so you don't draw into a
canvas that is already gone.

### Why the helper looks the way it does

A couple of defensive details in `createZimGame.jsx` are there on purpose - do not
remove them:

- **StrictMode guard.** React StrictMode runs effects twice in development
  (mount, unmount, mount). An `initializedRef` flag makes sure ZIM only starts once per
  real mount, so you don't get two canvases.
- **One-tick delay before creating the Frame.** ZIM finishes its own setup on a timer.
  If a Frame is created during a mount that immediately unmounts (StrictMode, or a
  remount when the user logs in/out), it would wake up pointing at a removed canvas and
  crash with a "cannot set properties of null" error. Deferring creation by one tick
  lets the cleanup cancel it first.
- **Dispose is wrapped in try/catch.** If the canvas is already gone, ZIM's `dispose`
  can throw; we log it as safe-to-ignore rather than crash.

## Quick reference

| I want to... | Do this |
|--------------|---------|
| Add zoom controls to a wrapper | `useCanvasZoom()`, render `controls`, apply `zoom` as `--canvas-zoom` |
| Build a new ZIM game | Use `createZimGame({ id, width, height, setup })` - don't make your own Frame |
| Stop timers when a game closes | Return a cleanup function from `setup` |
| Do async work safely in a game | Check `isDisposed()` before touching the stage |

## Things worth knowing

- Zoom is visual only. It never changes gameplay coordinates, so you can zoom mid-game
  safely.
- If a game "keeps ticking" after you leave it, its `setup` started a timer and did not
  return a cleanup that clears it. That is the first place to look.
- Let the helper own the Frame. Creating your own `zim.Frame` inside a game re-introduces
  the duplicate-canvas and crash bugs the helper exists to prevent.
