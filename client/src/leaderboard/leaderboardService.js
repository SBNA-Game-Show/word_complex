/**
 * leaderboardService.js
 * --------------------------------------------------------------------------
 * Frontend access to the leaderboard read API. Same fetch + VITE_API_URL
 * pattern as the other game services in src/services/.
 *
 *   fetchLeaderboard(board, limit) -> [{ rank, uuid, displayName, avatar, score, bestTime }]
 *   fetchPlayerRank(uuid, board)   -> { uuid, rank, score } | null (no record yet)
 *
 * `board` is "master" or one of the game keys (WordHunt, PassageReconstruction,
 * ContextQuiz, MeaningBridge).
 * --------------------------------------------------------------------------
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function readJson(response, fallbackMessage) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }
  return data;
}

/** Top players for a board. Returns an array of leaderboard rows. */
export async function fetchLeaderboard(board = "master", limit = 100) {
    if (board === "ContextQuiz") {
    const response = await fetch(
      `${API_BASE}/fillInBlanks/leaderboard?limit=10`
    );

    const json = await readJson(
      response,
      "Failed to load Context Quiz leaderboard"
    );

    return json.data ?? [];
  }
  if (board === "PassageReconstruction") {
    const response = await fetch(
      `${API_BASE}/passageReconstruct/leaderboard?limit=10`
    );

    const json = await readJson(
      response,
      "Failed to load Passage Reconstruction leaderboard"
    );

    return json.data ?? [];
  }
  const params = new URLSearchParams({ game: board, limit: String(limit) });
  const response = await fetch(`${API_BASE}/leaderboard?${params}`);
  const json = await readJson(response, "Failed to load leaderboard");
  return json.data ?? [];
}

/**
 * A single player's rank on a board. Resolves to null (rather than throwing)
 * when the player has no leaderboard record yet, so callers can show a
 * "play a game to join" prompt instead of an error.
 */
export async function fetchPlayerRank(uuid, board = "master") {
  if (!uuid) return null;
  const params = new URLSearchParams({ uuid, game: board });
  const response = await fetch(`${API_BASE}/leaderboard/rank?${params}`);
  if (response.status === 404) return null;
  const json = await readJson(response, "Failed to load your rank");
  return json.data ?? null;
}
