// CharacterHelper
// ---------------
// Renders the player's selected reading buddy in the scene's right-side standing
// area. The pop-in animation (fade + rise + bounce) is driven entirely by CSS in
// GameScene.css; this component only places the image and applies position vars.
//
// Image source: client/public/characters/<characterId>.png
// (the same roster used by CharacterSelect.jsx).

export default function CharacterHelper({ characterId, character, entered }) {
  // `character` comes from sceneConfig and is anchored to the BACKGROUND art
  // (see sceneConfig.js): { left, bottom, width, scale }. Because the parent
  // `.scene-surface` shares the background's cover geometry, these values keep
  // the character glued to the painted surface on any display.
  const {
    left = "90%",
    bottom = "15%",
    width = "9%",
    scale = 1,
  } = character ?? {};

  return (
    <div
      className={`character-helper${entered ? " is-entered" : ""}`}
      style={{
        // ── Character standing position (tune in sceneConfig.js) ───────────
        "--char-left": left,
        "--char-bottom": bottom,
        "--char-width": width,
        "--char-scale": scale,
      }}
      aria-hidden="true"
    >
      <span className="character-helper-shadow" />
      <img
        className="character-helper-img"
        // ── Selected character image ─────────────────────────────────────
        src={`/characters/${characterId}.png`}
        alt=""
        draggable="false"
      />
    </div>
  );
}
