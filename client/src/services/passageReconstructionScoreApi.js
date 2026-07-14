const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export async function submitPassageReconstructionScore(scoreData) {
  const response = await fetch(`${API_BASE}/passageReconstruct/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scoreData),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to save score");
  }

  return data;
}
