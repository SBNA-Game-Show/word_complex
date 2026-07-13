import { getSelectedStoryId } from "../storyPicker/activeStory";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const REQUEST_TIMEOUT_MS = 10000;

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || fallbackMessage);
  }

  return data;
}

export async function fetchMeaningBridgeRound(mode, pairCount) {
  const response = await fetchWithTimeout(
    `${API_BASE}/meaningBridge/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, pairCount, storyId: getSelectedStoryId() }),
    },
  );

  return readJsonResponse(response, "Failed to fetch Meaning Bridge round");
}

export async function submitMeaningBridgeScore({
  roundId,
  playerName,
  matches,
  timeSeconds,
  hintsUsed,
  wrongAttempts,
  pairCount,
}) {
  const response = await fetchWithTimeout(`${API_BASE}/meaningBridge/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roundId,
      playerName,
      matches,
      timeSeconds,
      hintsUsed,
      wrongAttempts,
      pairCount,
    }),
  });

  return readJsonResponse(response, "Failed to submit Meaning Bridge score");
}

/**
 * Save a finished session to the `meaning-bridge` MongoDB collection.
 * One document per player (uuid) — the server keeps only the highest attempt.
 */
export async function saveMeaningBridgeBestScore({
  uuid,
  playerName,
  score,
  timeSeconds,
  accuracy,
}) {
  const response = await fetchWithTimeout(`${API_BASE}/meaningBridge/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid, playerName, score, timeSeconds, accuracy }),
  });

  return readJsonResponse(response, "Failed to save Meaning Bridge best score");
}

/**
 * Persistent leaderboard from the `meaning-bridge` collection:
 * one row per player, highest attempt only. Survives server restarts.
 */
export async function fetchMeaningBridgeGlobalLeaderboard(limit = 10) {
  const response = await fetchWithTimeout(
    `${API_BASE}/meaningBridge/score/leaderboard?limit=${encodeURIComponent(limit)}`,
    {},
  );

  return readJsonResponse(
    response,
    "Failed to fetch Meaning Bridge leaderboard",
  );
}

export async function fetchMeaningBridgeLeaderboard(limit = 10) {
  const response = await fetchWithTimeout(
    `${API_BASE}/meaningBridge/leaderboard?limit=${encodeURIComponent(limit)}`,
    {},
  );

  return readJsonResponse(
    response,
    "Failed to fetch Meaning Bridge leaderboard",
  );
}
