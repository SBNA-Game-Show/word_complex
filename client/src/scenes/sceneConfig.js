// Scene configuration registry
// =============================
// Single source of truth for each game's launch "environment": the full-screen
// background art, where the ZIM canvas sits, where the helper character stands,
// and how long the swipe transition lasts.
//
// To give a future game (e.g. Word Hunt, Fill in the Blanks) its own environment:
//   1. Drop its background art in client/public/scenes/<name>.png, then run
//      `npm run optimize:images` to generate the shipped .webp (see scripts/)
//   2. Add a new entry below keyed by the game's `id` (from games/index.js)
//   3. That's it — App.jsx will automatically route it through the scene system.
//
// A game WITHOUT an entry here keeps using the plain GameScreen wrapper.

export const sceneConfigs = {
  // Passage Reconstruction (a.k.a. the "sentence-builder" game).
  "sentence-builder": {
    // ── Passage Reconstruction background image ─────────────────────────────
    // Full-screen illustrated background drawn behind the canvas + character.
    background: "/scenes/passage-reconstruction.webp",

    // ── Transition / swipe duration (keep within ~600–900ms) ────────────────
    // Controls how long the menu swipes away before the scene mounts, and is
    // mirrored by the CSS slide-in timing.
    transitionMs: 750,

    // ── Background aspect ratio (width / height of the background image) ─────
    // Used so the character can be anchored to the artwork's surface instead of
    // the viewport. The background is rendered "cover" at this ratio and the
    // character layer shares the exact same geometry, so the character's feet
    // stay glued to the same spot on the art at ANY screen size/shape.
    // passage-reconstruction.png is 1672 x 941.
    backgroundAspect: 1672 / 941,

    // ── ZIM canvas size / position ──────────────────────────────────────────
    // `maxWidth` caps the canvas area width in px (bigger value = bigger canvas).
    // `offsetX` nudges the canvas horizontally from the left edge (any CSS length;
    // larger value = further to the right).
    canvas: { maxWidth: 1100, side: "left", offsetX: "8%" },

    // ── Character standing position (anchored to the BACKGROUND artwork) ─────
    // All values are relative to the background image, not the viewport, so the
    // character sticks to the surface on every display:
    //   left   = horizontal center of the character across the background
    //   bottom = feet distance up from the background's bottom edge
    //   width  = character width as a % of the background width (scales w/ art)
    //   scale  = extra size multiplier
    character: {
      side: "right",
      left: "82%",
      bottom: "26%",
      width: "17%",
      scale: 1,
    },

    // Fallback character if the player hasn't picked one yet.
    defaultCharacterId: "tomely",
  },

  // Meaning Bridge. Background is part of the same matched art set as Passage
  // Reconstruction (1672 x 941), so it reuses the same aspect + character spot.
  "meaning-bridge": {
    background: "/scenes/meaning-bridge.webp",
    transitionMs: 750,
    backgroundAspect: 1672 / 941,
    canvas: { maxWidth: 1100, side: "left", offsetX: "8%" },
    character: {
      side: "right",
      left: "82%",
      bottom: "26%",
      width: "17%",
      scale: 1,
    },
    defaultCharacterId: "tomely",
  },

  // Context Cloze Quest. NOTE: the art file is named context-cloze.png while the
  // game id is "context-cloze-quest".
  "context-cloze-quest": {
    background: "/scenes/context-cloze.webp",
    transitionMs: 750,
    backgroundAspect: 1672 / 941,
    canvas: { maxWidth: 1100, side: "left", offsetX: "8%" },
    character: {
      side: "right",
      left: "82%",
      bottom: "26%",
      width: "17%",
      scale: 1,
    },
    defaultCharacterId: "tomely",
  },

  // Word Hunt. Its ZIM canvas is 1280 x 720, so it gets a slightly wider canvas
  // cap than the 1100-wide games.
  "word-hunt": {
    background: "/scenes/word-hunt.webp",
    transitionMs: 750,
    backgroundAspect: 1672 / 941,
    canvas: { maxWidth: 1200, side: "left", offsetX: "8%" },
    character: {
      side: "right",
      left: "82%",
      bottom: "26%",
      width: "17%",
      scale: 1,
    },
    defaultCharacterId: "tomely",
  },
};

export function getSceneConfig(id) {
  return sceneConfigs[id] ?? null;
}
