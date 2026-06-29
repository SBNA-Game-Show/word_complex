/**
 * leaderboardConfig.js
 * --------------------------------------------------------------------------
 * Single source of truth for the leaderboard's shared constants.
 *
 * GAME_KEYS are the exact strings Anthony's score check sends us and the exact
 * field names stored on each player document. They are deliberately no-space
 * PascalCase: MongoDB aggregation field paths (used in the write pipeline)
 * cannot reference a key that contains spaces, so "Context Quiz" would break
 * but "ContextQuiz" works. If a game is renamed, change it HERE only.
 * --------------------------------------------------------------------------
 */

const COLLECTION_NAME = "players";

// The 4 minigames that make up a board. Order is the display order in the UI.
const GAME_KEYS = [
  "WordHunt",
  "PassageReconstruction",
  "ContextQuiz",
  "MeaningBridge",
];

// The "Master" board isn't a game — it's the sum of the 4 game scores.
const MASTER_KEY = "master";

module.exports = { COLLECTION_NAME, GAME_KEYS, MASTER_KEY };
