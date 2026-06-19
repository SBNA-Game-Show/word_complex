const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function readJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
}

export async function getFillInBlanks(options = {}) {
  const params = new URLSearchParams({
    language: options.language || "english",
    wordTypes: options.wordTypes || "NOUN",
    difficulty: options.difficulty || "easy",
  });

  const response = await fetch(`${API_BASE}/fillInBlanks?${params}`);

  return readJsonResponse(response, "Failed to fetch fill in blanks game");
}