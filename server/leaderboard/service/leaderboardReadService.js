/**
 * leaderboardReadService.js
 * --------------------------------------------------------------------------
 * Read side of the leaderboard. Pure, index-backed queries — no writes.
 *
 *   getLeaderboard({ game, limit })  -> the top N rows for a board
 *   getPlayerRank({ uuid, game })    -> a single player's position ("you're #12")
 *
 * "Master" is FEDERATED (see masterLeaderboardService.js): built by merging
 * each game's own top-X function, normalized to 0–100 per game. Game boards
 * still read the legacy `players` collection until each game's own endpoint
 * is wired in on the frontend.
 * --------------------------------------------------------------------------
 */

const { getPlayersCollection } = require("../db/playersCollection");
const { GAME_KEYS, MASTER_KEY } = require("../leaderboardConfig");
const {
  getMasterLeaderboard,
  getMasterPlayerRank,
} = require("./masterLeaderboardService");

/**
 * Translate a board name into how we sort/read it.
 * Returns the sort spec, the field holding the sortable score, and (for game
 * boards) the path to that game's subdocument.
 */
const resolveBoard = (game) => {
  if (game === MASTER_KEY) {
    return { sort: { masterScore: -1 }, scoreField: "masterScore", gamePath: null };
  }
  if (!GAME_KEYS.includes(game)) {
    throw new Error(
      `Unknown board "${game}". Expected "${MASTER_KEY}" or one of: ${GAME_KEYS.join(", ")}`,
    );
  }
  return {
    sort: { [`${game}.score`]: -1, [`${game}.bestTime`]: 1 },
    scoreField: `${game}.score`,
    gamePath: game,
  };
};

/** Flatten a stored player doc into a clean leaderboard row. */
const toRow = (doc, gamePath, rank) => {
  const isMaster = gamePath === null;
  const gameStats = isMaster ? null : doc[gamePath] || {};
  return {
    rank,
    uuid: doc._id,
    displayName: doc.displayName || null,
    avatar: doc.avatar || null,
    score: isMaster ? doc.masterScore || 0 : gameStats.score || 0,
    bestTime: isMaster ? null : gameStats.bestTime ?? null,
  };
};

/**
 * Top N players for a board.
 * @param {Object} args
 * @param {string} [args.game="master"]  "master" or a GAME_KEYS value.
 * @param {number} [args.limit=100]      How many rows to return (1-500).
 */
const getLeaderboard = async ({ game = MASTER_KEY, limit = 100 } = {}) => {
  if (game === MASTER_KEY) {
    return getMasterLeaderboard({ limit });
  }

  const { sort, gamePath } = resolveBoard(game);
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);

  const players = await getPlayersCollection();
  const docs = await players.find({}).sort(sort).limit(safeLimit).toArray();

  return docs.map((doc, i) => toRow(doc, gamePath, i + 1));
};

/** Read a nested numeric field like "WordHunt.score" off a doc, defaulting to 0. */
const readScoreField = (doc, scoreField) =>
  scoreField.split(".").reduce((val, key) => (val == null ? val : val[key]), doc) || 0;

/**
 * A single player's rank on a board = (players strictly above them) + 1.
 * Returns null if the player has no document yet.
 * @param {Object} args
 * @param {string} args.uuid             Player identity (Firebase UID).
 * @param {string} [args.game="master"]  Which board to rank them on.
 */
const getPlayerRank = async ({ uuid, game = MASTER_KEY } = {}) => {
  if (!uuid) throw new Error("uuid is required");
  if (game === MASTER_KEY) {
    return getMasterPlayerRank({ uuid });
  }

  const { scoreField } = resolveBoard(game);

  const players = await getPlayersCollection();
  const doc = await players.findOne({ _id: uuid });
  if (!doc) return null;

  const myScore = readScoreField(doc, scoreField);
  const above = await players.countDocuments({ [scoreField]: { $gt: myScore } });

  return { uuid, rank: above + 1, score: myScore };
};

module.exports = { getLeaderboard, getPlayerRank };
