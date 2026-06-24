// CharacterHelper
// ---------------
// Renders the player's selected reading buddy in the scene's right-side standing
// area. The pop-in animation (fade + rise + bounce) is driven entirely by CSS in
// GameScene.css; this component only places the image and applies position vars.
//
// Image source: client/public/characters/<characterId>.png
// (the same roster used by CharacterSelect.jsx).

export default function CharacterHelper({ characterId, character, entered, speech }) {
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

  // Map the raw mood into a reaction used for the bubble accent color and the
  // little character "react" wiggle.
  const reaction =
    speech?.mood === "correct" || speech?.mood === "complete"
      ? "happy"
      : speech?.mood === "hint"
        ? "thinking"
        : speech
          ? "oops"
          : null;

  return (
    <div
      className={`character-helper${entered ? " is-entered" : ""}${
        reaction ? ` is-reacting react-${reaction}` : ""
      }`}
      style={{
        // ── Character standing position (tune in sceneConfig.js) ───────────
        "--char-left": left,
        "--char-bottom": bottom,
        "--char-width": width,
        "--char-scale": scale,
      }}
      aria-hidden="true"
    >
      {/* Speech bubble — re-keyed on speech.id so it re-pops every reaction. */}
      {speech && (
        <div
          key={speech.id}
          className={`character-speech mood-${reaction}${speech.leaving ? " is-leaving" : ""}`}
          role="status"
          aria-hidden="false"
        >
          {speech.text}
          <span className="character-speech-tail" aria-hidden="true" />
        </div>
      )}
      <span className="character-helper-shadow" />
      {/* `.character-helper-pose` is a dedicated transform layer for the react
          wiggle. Keeping it separate from `.character-helper-img` means the
          reaction never touches (and never restarts) the image's entrance +
          idle animation — its transform simply composes on top. */}
      <span className="character-helper-pose">
        <img
          className="character-helper-img"
          // ── Selected character image ─────────────────────────────────────
          src={`/characters/${characterId}.webp`}
          alt=""
          draggable="false"
        />
      </span>
    </div>
  );
}
