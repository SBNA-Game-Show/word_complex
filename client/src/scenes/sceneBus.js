// sceneBus
// --------
// Tiny module-level pub/sub used to bridge the isolated ZIM canvas (rendered
// inside createZimGame, which passes no props/callbacks) to the surrounding
// React scene. The SentenceBuilder game emits feedback events here; GameScene
// subscribes and reacts by having the helper character "say" something.
//
// Intentionally minimal and framework-agnostic so any future scene-based game
// can reuse it without a heavier dependency.

const listeners = new Set();

// Notify every subscriber of a scene event.
//   mood: "correct" | "wrong" | "roundOver" | "complete" (free-form string)
//   payload: optional extra data for the listener
export function emit(mood, payload) {
  listeners.forEach((fn) => {
    try {
      fn(mood, payload);
    } catch {
      // A misbehaving listener should never break the game loop.
    }
  });
}

// Register a listener. Returns an unsubscribe function for cleanup.
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
