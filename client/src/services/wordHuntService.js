const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const retrieveEnglishVersion = async () => {
  try {
    const response = await fetch(`${API_BASE}/wordHunt/POSEnglish`);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();

    // console.log("Response from word hunt:", data);

    return data;
  } catch (error) {
    console.error("Failed to fetch English version:", error);
    return null;
  }
};
