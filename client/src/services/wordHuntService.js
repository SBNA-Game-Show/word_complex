const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const getActiveStorySetId = async () => {
  const response = await fetch(`${API_BASE}/storySets/active`);
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || `Failed to load active story set: ${response.status}`,
    );
  }

  const setId = result?.data?.setId;
  if (!setId) {
    throw new Error("Active story set response did not include setId");
  }

  return setId;
};

// PASSAGE END POINT CONNECTION
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
    // console.log("Sanskrit Version Response: ", result);
    return result.data;
  } catch (error) {
    console.error("Failed to fetch English version:", error);
    return null;
  }
};

// GAME END POINTS CONNECTION

export const writeStoryInformation = async (storyInfo) => {
  try {
    const response = await fetch(`${API_BASE}/wordHunt/addStoryInfo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(storyInfo),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save story information");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to save story information:", error);
    throw error;
  }
};

export const writeGameInformation = async (gameInfo) => {
  try {
    const response = await fetch(`${API_BASE}/wordHunt/addGameData`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameInfo),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save Game information");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to save Game information:", error);
    throw error;
  }
};

export const getPlayerInfo = async (gameId, storyId, playerName) => {
  try {
    const params = new URLSearchParams({
      gameId,
      storyId,
      playerName,
    });
    const response = await fetch(
      `${API_BASE}/wordHunt/playerData?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to Retrieve Player Information");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to retrieve Player information:", error);
    throw error;
  }
};

export default {
  getActiveStorySetId,
  retrieveEnglishVersion,
  retrieveSanskritVersion,
  writeStoryInformation,
  writeGameInformation,
};
