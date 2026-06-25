// countdownPolicy
// ---------------
// Tiny, framework-agnostic helper that tracks the remaining time of a game
// countdown and whether it is currently paused. Like hintPolicy, it holds NO
// ZIM/React references and never touches the ticker itself — the game drives
// `tick()` once per second from a ZIM interval(), exactly as the game owns the
// score while hintPolicy only exposes `penalty`. That keeps this module pure
// and trivially unit-testable, so any timed game can reuse it.
//
//   const countdown = createCountdown({ seconds: 90 });
//   countdown.pause();                 // e.g. while showing a "memorise" screen
//   countdown.resume();                // back to play
//   if (countdown.tick() <= 0) ...     // call each second; won't go below 0
//   countdown.expired();               // true once time runs out
//   countdown.reset();                 // refill for a new game

export function createCountdown({ seconds = 90 } = {}) {
  let remaining = seconds;
  let paused = false;

  return {
    // Read-only starting value (handy for "Time 1:30" formatting / progress).
    total: seconds,

    // How many whole seconds are left.
    remaining() {
      return remaining;
    },

    // Whether the clock is currently frozen.
    isPaused() {
      return paused;
    },

    // Freeze the clock — ticks won't decrement until resume().
    pause() {
      paused = true;
    },

    // Unfreeze the clock.
    resume() {
      paused = false;
    },

    // Advance one second of game time. Does nothing while paused or already at
    // zero, so the floor is 0. Returns the new remaining value.
    tick() {
      if (!paused && remaining > 0) remaining -= 1;
      return remaining;
    },

    // True once the clock has run out.
    expired() {
      return remaining <= 0;
    },

    // Refill for a new game and unpause.
    reset() {
      remaining = seconds;
      paused = false;
    },
  };
}
