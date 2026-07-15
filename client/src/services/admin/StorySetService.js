// ======================================================
// StorySetService.js
// Render Backend API
// ======================================================

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const STORY_SET_API = `${API_BASE}/admin/storySets`;

/**
 * Get all Story Sets
 */
export async function getStorySets() {
  const response = await fetch(STORY_SET_API);

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to load Story Sets");
  }

  return result;
}

/**
 * Create Story Set
 *
 * name: string
 * storyIds: array of story ids
 */
export async function createStorySet(name, storyIds) {
  const response = await fetch(STORY_SET_API, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      name,

      storyIds,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to create Story Set");
  }

  return result;
}

/**
 * Activate Story Set
 */
export async function activateStorySet(setId) {
  const response = await fetch(
    `${STORY_SET_API}/active`,

    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        setId,
      }),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to activate Story Set");
  }

  return result;
}

/**
 * Delete Story Set
 */
export async function deleteStorySet(setId) {
  const response = await fetch(
    `${STORY_SET_API}/${setId}`,

    {
      method: "DELETE",
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to delete Story Set");
  }

  return result;
}
