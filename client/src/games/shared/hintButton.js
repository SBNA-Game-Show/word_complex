// hintButton
// ----------
// Shared in-canvas ZIM "Hint" button. It is only a TRIGGER: it shows how many
// hints remain (read from a hintPolicy) and, when clicked with hints available,
// calls the game-supplied `onUse` callback. It deliberately knows nothing about
// what a hint *does* — the game's own `applyHint` performs the reveal, decides
// whether a hint was actually consumable, and calls `policy.use()` + this
// widget's `refresh()`.
//
// Because it lives inside the ZIM canvas (not the React scene), any ZIM game can
// adopt it with one import + one call, regardless of whether it has a scene.
//
//   const hintButton = createHintButton({
//     stage, zim, W, H, x, y,
//     policy: hintPolicy,
//     onUse: applyHint,
//     palette: { bg: "#f4c45a", color: "#1f4a5c" },
//   });

const zimFont = "Fredoka";

export function createHintButton({
  stage,
  zim,
  x,
  y,
  policy,
  onUse,
  label = "Hint",
  width = 132,
  height = 42,
  palette = {},
}) {
  const bg = palette.bg ?? "#f4c45a";
  const rollBg = palette.rollBg ?? "#ffd97a";
  const downBg = palette.downBg ?? "#caa24a";
  const color = palette.color ?? "#1f4a5c";

  const labelText = () => `${label} (${policy.remaining()})`;

  const buttonLabel = new zim.Label(labelText(), 18, zimFont, color);
  buttonLabel.fontOptions = "bold";

  const button = new zim.Button({
    width,
    height,
    label: buttonLabel,
    backgroundColor: bg,
    rollBackgroundColor: rollBg,
    downBackgroundColor: downBg,
    color,
    corner: 21,
  }).addTo(stage).loc(x, y);

  function applyEnabledState() {
    const usable = policy.canUse();
    button.enabled = usable;
    button.cursor = usable ? "pointer" : "default";
    button.alpha = usable ? 1 : 0.5;
  }

  // A single press should spend exactly one hint. ZIM Buttons can dispatch their
  // click twice for one physical tap, so we ignore any duplicate that arrives in
  // the same synchronous burst (the lock releases on the next tick).
  let firing = false;
  button.on("click", () => {
    if (firing) return;
    if (!policy.canUse()) return;
    firing = true;
    onUse();
    setTimeout(() => {
      firing = false;
    }, 0);
  });

  applyEnabledState();

  return {
    container: button,

    // Re-read the policy: update the "(N)" count and grey/disable at zero.
    refresh() {
      buttonLabel.text = labelText();
      applyEnabledState();
      stage.update();
    },

    destroy() {
      button.removeAllEventListeners();
      if (button.parent) button.parent.removeChild(button);
    },
  };
}
