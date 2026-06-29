/**
 * leaderboardWriteService.js
 * --------------------------------------------------------------------------
 * The ONLY write path into the leaderboard. Anthony's score check calls this
 * after a game finishes, passing the already-normalized (0-100) score and the
 * player's time. The leaderboard never calculates scores — it just stores them.
 *
 *   submitLeaderboardScore({ uuid, game, score, bestTime })
 *
 * Guarantees:
 *  - A worse score/time can never overwrite a better one ($max / $min guards),
 *    so retries and out-of-order writes are safe.
 *  - masterScore is recomputed from the 4 game scores in the same atomic
 *    update, so it can never drift out of sync with its parts.
 *  - Upserts: a brand-new player's document is created on their first score.
 * --------------------------------------------------------------------------
 */

const { getPlayersCollection } = require("../db/playersCollection");
const { GAME_KEYS } = require("../leaderboardConfig");

/** Throw if the game string isn't one of the 4 known keys. */
const assertValidGame = (game) => {
  if (!GAME_KEYS.includes(game)) {
    throw new Error(
      `Unknown game "${game}". Expected one of: ${GAME_KEYS.join(", ")}`,
    );
  }
};

/** Throw if a value isn't a finite, non-negative number. */
const assertNonNegativeNumber = (value, label) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number, got: ${value}`);
  }
};

/**
 * Build the atomic update pipeline for one score submission.
 * Stage 1 keeps the best score (max) and best time (min) for this game.
 * Stage 2 re-sums every game's score into masterScore using the values
 * produced by stage 1, so master always equals the sum of its parts.
 */
const buildUpdatePipeline = (game, score, bestTime) => [
  {
    $set: {
      [`${game}.score`]: { $max: [{ $ifNull: [`$${game}.score`, 0] }, score] },
      [`${game}.bestTime`]: {
        $min: [{ $ifNull: [`$${game}.bestTime`, bestTime] }, bestTime],
      },
      updatedAt: "$$NOW",
    },
  },
  {
    $set: {
      masterScore: {
        $add: GAME_KEYS.map((key) => ({ $ifNull: [`$${key}.score`, 0] })),
      },
    },
  },
];

/**
 * Record a score for a player on a single game.
 * @param {Object}  args
 * @param {string}  args.uuid      Player identity (Firebase UID) — who to write to.
 * @param {string}  args.game      One of GAME_KEYS.
 * @param {number}  args.score     Normalized 0-100 score for this game.
 * @param {number}  args.bestTime  Completion time in ms (lower is better).
 * @returns {Promise<{ updated: boolean }>}
 */
const submitLeaderboardScore = async ({ uuid, game, score, bestTime }) => {
  if (!uuid || typeof uuid !== "string") {
    throw new Error("uuid is required and must be a string");
  }
  assertValidGame(game);
  assertNonNegativeNumber(score, "score");
  assertNonNegativeNumber(bestTime, "bestTime");

  const players = await getPlayersCollection();

  const result = await players.updateOne(
    { _id: uuid },
    buildUpdatePipeline(game, score, bestTime),
    { upsert: true },
  );

  return {
    updated: result.modifiedCount > 0 || result.upsertedCount > 0,
  };
};

module.exports = { submitLeaderboardScore };
