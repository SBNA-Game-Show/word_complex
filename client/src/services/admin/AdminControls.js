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
    return [];
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
    return [];
  }
};

/**
 * Download a story JSON file
 */
export const downloadStory = (story) => {
  try {
    const blob = new Blob(
      [JSON.stringify(story, null, 2)],
      {
        type: "application/json",
      }
    );

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
 * Add new story
 */
export const addNewStory = async (storyId) => {
  try {
    const response = await fetch(
      `${API_BASE}/addNew?story_id=${encodeURIComponent(storyId)}`,
      {
        method: "POST",
      }
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
 * Write metadata
 */
export const writeMeta = async () => {
  try {
    const response = await fetch(
      `${API_BASE}/writeMeta`,
      {
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
      }
    );

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to write metadata:", error);
    throw error;
  }
};
export const uploadStory = async (file, language) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("language", language);

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