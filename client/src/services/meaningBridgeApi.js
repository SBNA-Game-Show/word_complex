const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function readJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || fallbackMessage);
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
