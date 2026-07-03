import { getSelectedStoryId } from "../storyPicker/activeStory";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const getPassageReconstructionGame = async () => {
  try {
    const storyId = getSelectedStoryId();
    const query = storyId ? `?storyId=${encodeURIComponent(storyId)}` : "";
    const response = await fetch(`${API_BASE}/passageReconstruct/game${query}`);

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
