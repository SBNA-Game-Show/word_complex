const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function readJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || fallbackMessage);
  }

  return data;
}

export async function fetchMeaningBridgeRound(mode, pairCount) {
  const response = await fetch(`${API_BASE}/meaningBridge/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, pairCount }),
  });

  return readJsonResponse(response, "Failed to fetch Meaning Bridge round");
}

export async function submitMeaningBridgeScore({
  roundId,
  playerName,
  matches,
  timeSeconds,
  hintsUsed,
  wrongAttempts,
}) {
  const response = await fetch(`${API_BASE}/meaningBridge/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roundId,
      playerName,
      matches,
      timeSeconds,
      hintsUsed,
      wrongAttempts,
    }),
  });

  return readJsonResponse(response, "Failed to submit Meaning Bridge score");
}

export async function fetchMeaningBridgeLeaderboard(limit = 10) {
  const response = await fetch(
    `${API_BASE}/meaningBridge/leaderboard?limit=${encodeURIComponent(limit)}`,
  );

  return readJsonResponse(
    response,
    "Failed to fetch Meaning Bridge leaderboard",
  );
}
