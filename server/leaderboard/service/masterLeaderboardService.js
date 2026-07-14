/**
 * masterLeaderboardService.js
 * --------------------------------------------------------------------------
 * Master board under the FEDERATED model: each game owns its own collection
 * and exposes a "top X players" function. This service does NOT read the old
 * centralized `players` collection — it asks each game's adapter for its top
 * players, normalizes every score to a 0–100 scale, sums per player, and
 * ranks the result.
 *
 * Adapter contract (one per game — this is what each game's dev must supply):
 *
 *   {
 *     maxScore: <number>,            // max possible raw score for the game
 *     getTopPlayers: async (x) =>    // top x players of the game's collection
 *       [{ uuid, displayName, avatar?, score }]   // score = RAW best score
 *   }
 *
 * Normalization: normalized = rawScore / maxScore * 100.
 * Master score  : sum of a player's normalized scores across all games.
 * Ties          : deliberately loose — Array.sort is stable in Node, so equal
 *                 master scores keep insertion order (first game checked wins).
 *
 * Games without a real adapter yet are `null` and simply skipped, so the
 * master board works with however many games are live.
 *
 * KNOWN LIMIT: we can only see each game's top PER_GAME_FETCH players, so a
 * player grinding one game just below its cutoff is invisible to master.
 * Fine at current scale; revisit if collections grow past the fetch depth.
 * --------------------------------------------------------------------------
 */

const { GAME_KEYS } = require("../leaderboardConfig");
const contextClozeService = require("../../fillinblanks/services/contextClozeQuestScoreService");
const passageReconstructionScoreService = require("../../passagereconstruction/service/passageReconstructionScoreService");
const meaningBridgeScoreService = require("../../meaning-bridge/service/meaningBridgeScoreService");

// How many rows we pull from each game before merging. ContextQuiz's service
// clamps at 100, so going higher there is a no-op.
const PER_GAME_FETCH = 100;

/**
 * MAX POSSIBLE SCORE PER GAME — adjust here if a game's scoring changes.
 * Used to normalize every raw score to 0–100 before summing into master.
 * A max of 0 means "not known yet" (that game contributes nothing).
 */
const contextQuizMAX = 1140;
const wordHuntMAX = 0; // TODO (Sabahat)
const passageReconstructionMAX = 750; // 3 rounds x 100 + 90s x 5 time bonus
const meaningBridgeMAX = 285; // 3 rounds (4+5+6 pairs) x 10/pair + 3 x 45 max speed bonus

/**
 * One adapter per GAME_KEYS entry. Live: ContextQuiz, PassageReconstruction,
 * MeaningBridge. Remaining TODO — WordHunt (Sabahat): needs a real Mongo
 * top-X + maxScore (current service still reads mock JSON).
 */
const ADAPTERS = {
  ContextQuiz: {
    maxScore: contextQuizMAX,
    getTopPlayers: async (x) => {
      const docs = await contextClozeService.getTopPlayers(x);
      return docs.map((d) => ({
        uuid: d._id,
        displayName: d.displayName ?? null,
        avatar: d.avatar ?? null,
        score: d.bestScore ?? 0,
      }));
    },
  },
  WordHunt: null, // TODO (Sabahat)
  PassageReconstruction: {
    maxScore: passageReconstructionMAX,
    getTopPlayers: async (x) => {
      const docs = await passageReconstructionScoreService.getTopPlayers(x);
      return docs.map((d) => ({
        uuid: d._id,
        displayName: d.displayName ?? null,
        avatar: d.avatar ?? null,
        score: d.bestScore ?? 0,
      }));
    },
  },
  MeaningBridge: {
    maxScore: meaningBridgeMAX,
    getTopPlayers: async (x) => {
      // Wasiq's rows are pre-shaped for his game scene: playerName/totalScore.
      const rows = await meaningBridgeScoreService.getTopPlayers(x);
      return rows.map((r) => ({
        uuid: r.uuid,
        displayName: r.playerName ?? null,
        avatar: r.avatar ?? null,
        score: r.totalScore ?? 0,
      }));
    },
  },
};

/** rawScore -> 0–100. Guards against a missing/zero maxScore. */
const normalize = (rawScore, maxScore) =>
  maxScore > 0 ? ((Number(rawScore) || 0) / maxScore) * 100 : 0;

/**
 * Merge every live game's top players into one master list.
 * Returns UNSLICED rows sorted by master score (no rank field yet).
 */
const buildMasterRows = async () => {
  const byUuid = new Map();

  for (const gameKey of GAME_KEYS) {
    const adapter = ADAPTERS[gameKey];
    if (!adapter) continue; // game not wired up yet

    const rows = await adapter.getTopPlayers(PER_GAME_FETCH);

    for (const row of rows) {
      if (!row?.uuid) continue;
      const normalized = normalize(row.score, adapter.maxScore);
      const existing = byUuid.get(row.uuid);

      if (existing) {
        existing.score += normalized;
        // Keep the first non-empty identity fields we saw.
        existing.displayName = existing.displayName || row.displayName || null;
        existing.avatar = existing.avatar || row.avatar || null;
      } else {
        byUuid.set(row.uuid, {
          uuid: row.uuid,
          displayName: row.displayName ?? null,
          avatar: row.avatar ?? null,
          score: normalized,
        });
      }
    }
  }

  // Stable sort: ties keep first-checked order on purpose.
  return [...byUuid.values()].sort((a, b) => b.score - a.score);
};

/**
 * Top N of the master board, in the same row shape the frontend already
 * renders: { rank, uuid, displayName, avatar, score, bestTime }.
 */
const getMasterLeaderboard = async ({ limit = 100 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const rows = await buildMasterRows();

  return rows.slice(0, safeLimit).map((row, i) => ({
    rank: i + 1,
    ...row,
    bestTime: null, // time is a per-game stat; master has none
  }));
};

/**
 * A single player's master rank, or null if they appear on no game board.
 * Shape matches the read service: { uuid, rank, score }.
 */
const getMasterPlayerRank = async ({ uuid } = {}) => {
  if (!uuid) throw new Error("uuid is required");
  const rows = await buildMasterRows();
  const index = rows.findIndex((row) => row.uuid === uuid);
  if (index === -1) return null;
  return { uuid, rank: index + 1, score: rows[index].score };
};

module.exports = { getMasterLeaderboard, getMasterPlayerRank, ADAPTERS };
