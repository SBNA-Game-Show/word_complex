const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const retrieveEnglishVersion = async (storyId) => {
  try {
    if (!storyId) {
      throw new Error("storyId is required");
    }

    const response = await fetch(
      `${API_BASE}/wordHunt/POSEnglish?storyId=${storyId}`,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(
        errorData?.message || `Request failed: ${response.status}`,
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch English version:", error);
    return null;
  }
};

export const retrieveSanskritVersion = async (storyId) => {
  try {
    if (!storyId) {
      throw new Error("storyId is required");
    }

    const response = await fetch(
      `${API_BASE}/wordHunt/POSSanskrit?storyId=${storyId}`,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      throw new Error(
        errorData?.message || `Request failed: ${response.status}`,
      );
    }

    const result = await response.json();
    console.log("Sanskrit Version Response: ", result);
    return result.data;
  } catch (error) {
    console.error("Failed to fetch English version:", error);
    return null;
  }
};

export default { retrieveEnglishVersion, retrieveSanskritVersion };
