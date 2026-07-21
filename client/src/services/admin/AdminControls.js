const API_BASE = "https://bhojgc-sb-dict.hf.space/api/v1/python";

/**
 * Get all stories
 */
export const getAllStories = async () => {
  try {
    const response = await fetch(`${API_BASE}/getAll`);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch stories:", error);
    throw error;
  }
};
/**
 * Get all available stories from Sanskrit.Samskrutam.com
 */
export const getUnusedStories = async () => {
  try {
    const response = await fetch(`${API_BASE}/getUnused`);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch available Sanskrit stories:", error);

    throw error;
  }
};

/**
 * Get all tokenized stories
 */
export const getAllTokenizedStories = async () => {
  try {
    const response = await fetch(`${API_BASE}/getAllTokenized`);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch tokenized stories:", error);

    throw error;
  }
};

/**
 * Download a story JSON file
 */
export const downloadStory = (story) => {
  try {
    const blob = new Blob([JSON.stringify(story, null, 2)], {
      type: "application/json",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    const fileName =
      story?.title?.englishversion
        ?.replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase() || "story";

    link.href = url;
    link.download = `${fileName}.json`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
  }
};

/**
 * Add new story from learn sanskrit
 */
export const addNewStory = async (storyId) => {
  try {
    const response = await fetch(
      `${API_BASE}/addNew?story_id=${encodeURIComponent(storyId)}`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to add story:", error);
    throw error;
  }
};
/**
 * Add new Sanskrit.Samskrutam story
 */
export const addNewSamskrutamStory = async (storyId) => {
  try {
    const response = await fetch(
      `${API_BASE}/addNewStory?story_id=${encodeURIComponent(storyId)}`,
      {
        method: "POST",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Failed to add Samskrutam story:", error);
    throw error;
  }
};
/**
 * Write metadata for Learn Sanskrit stories
 */
export const writeLearnSanskritMeta = async () => {
  try {
    const response = await fetch(`${API_BASE}/writeMeta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow: [
          "Fetches Meta data from LearnSanskrit.cc",
          "Cleans and normalizes text",
          "Stores processed output in MongoDB Atlas",
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to write metadata:", error);
    throw error;
  }
};
// write metadata for Samskrutam stories
export const writeSamskrutamMeta = async () => {
  try {
    const response = await fetch(`${API_BASE}/writeMetaData`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow: [
          "Fetches Meta data from sanskrit.samskrutam.com",
          "Cleans and normalizes text",
          "Stores processed output in MongoDB Atlas",
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to write Samskrutam metadata:", error);
    throw error;
  }
};
// upload the asset/ story into application
export const uploadStory = async (file) => {
  const formData = new FormData();

  formData.append("file", file);
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Upload failed");
  }

  return data;
};
