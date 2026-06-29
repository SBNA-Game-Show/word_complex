// speechLines
// -----------
// Generic, shared speech-bubble lines for the helper character. Keyed by the
// "mood" events emitted on sceneBus while playing a scene-based game. Lines are
// intentionally buddy-agnostic (one pool for every character).

export const SPEECH_LINES = {
  // Player ordered the passage correctly.
  correct: [
    "You nailed it!",
    "Beautiful sentence!",
    "That reads perfectly!",
    "Wonderful ordering!",
    "You're a natural storyteller!",
  ],
  // Player checked an incorrect order (still has attempts left).
  wrong: [
    "Hmm, not quite — try the order again.",
    "Close! Who acts first?",
    "Almost! Read it aloud and listen.",
    "Shuffle a couple clouds and retry.",
  ],
  // Player ran out of attempts on a round.
  roundOver: [
    "No worries — let's take this one from the top.",
    "Deep breath! We'll rebuild it together.",
  ],
  // Player finished every round.
  complete: [
    "You rebuilt every passage — amazing!",
    "Quest complete! I knew you could do it.",
  ],
  // The countdown ran out before the player finished.
  timeUp: [
    "Out of time — great effort, though!",
    "The clock beat us this round. Let's try again!",
    "Time's up! You were so close.",
  ],
  // Player asked for a hint. Normally the game emits "hint" with a specific line in
  // the payload (e.g. which cloud goes where); these are generic fallbacks.
  hint: [
    "Here's a little nudge!",
    "Let me give you a hand.",
    "Try this one next!",
  ],
};

// Pick a random line for a mood, or null if the mood has none.
export function pickLine(mood) {
  const pool = SPEECH_LINES[mood];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
