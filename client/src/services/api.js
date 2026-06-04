const API_BASE = import.meta.env.VITE_API_URL;

console.log("API_BASE =", API_BASE);

export async function getFillInBlanks() {
  const response = await fetch(`${API_BASE}/fillInBlanks`);

  if (!response.ok) {
    throw new Error("Failed to fetch game");
  }

  return response.json();
}
