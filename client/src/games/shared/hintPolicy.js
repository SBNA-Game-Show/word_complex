// hintPolicy
// ----------
// Tiny, framework-agnostic helper that tracks how many hints a player may use in
// the current round and the score penalty each hint costs. It holds NO ZIM/React
// references and never touches the score itself — it just exposes `penalty` as
// data and lets the game subtract it. That keeps this module pure and trivially
// unit-testable, so any game can reuse it the same way the character-feedback
// system reuses sceneBus.
//
// Unlike sceneBus (a module-level singleton for fire-and-forget events), hint
// state is per-game-instance and resets every round, so this is a factory.
//
//   const policy = createHintPolicy({ maxPerRound: 2, penalty: 25 });
//   if (policy.canUse()) { policy.use(); score -= policy.penalty; }
//   policy.reset();            // at the start of each new round

export function createHintPolicy({ maxPerRound = 2, penalty = 25 } = {}) {
  let remaining = maxPerRound;

  return {
    // Read-only data; the game decides how to apply it to its own score.
    penalty,

    // Whether a hint is still available this round.
    canUse() {
      return remaining > 0;
    },

    // Consume one hint. Returns true if one was available (and spent), else false
    // so callers can branch without re-checking canUse().
    use() {
      if (remaining <= 0) return false;
      remaining -= 1;
      return true;
    },

    // How many hints are left this round (drives the button label).
    remaining() {
      return remaining;
    },

    // Refill for a new round.
    reset() {
      remaining = maxPerRound;
    },
  };
}
