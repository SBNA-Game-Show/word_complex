import { getSelectedStoryId } from "../storyPicker/activeStory";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const getPassageReconstructionGame = async (language = "english") => {
  try {
    // Both the player's chosen story (from the picker store) and the language
    // travel with every request — the server is stateless for both.
    const storyId = getSelectedStoryId();
    const params = new URLSearchParams({ language });
    if (storyId) {
      params.set("storyId", storyId);
    }
    const response = await fetch(`${API_BASE}/passageReconstruct/game?${params}`);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch passage reconstruction game:", error);
    return null;
  }
};
