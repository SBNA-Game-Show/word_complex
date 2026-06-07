const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

console.log("API_BASE =", API_BASE);

async function readJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
}

export async function getFillInBlanks() {
  const response = await fetch(`${API_BASE}/fillInBlanks`);

  return readJsonResponse(response, "Failed to fetch game");
}

export async function generateMeaningBridgeRound(options = {}) {
  const response = await fetch(`${API_BASE}/meaningBridge/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: options.mode || "english-to-sanskrit",
      difficulty: options.difficulty || "easy",
      pairCount: options.pairCount || 4,
      previousPassageId: options.previousPassageId || null,
    }),
  });

  return readJsonResponse(response, "Failed to generate Meaning Bridge round");
}

export async function submitMeaningBridgeRound(payload) {
  const response = await fetch(`${API_BASE}/meaningBridge/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readJsonResponse(response, "Failed to submit Meaning Bridge round");
}

export async function getMeaningBridgeLeaderboard(limit = 5) {
  const response = await fetch(
    `${API_BASE}/meaningBridge/leaderboard?limit=${limit}`,
  );

  return readJsonResponse(
    response,
    "Failed to fetch Meaning Bridge leaderboard",
  );
}
