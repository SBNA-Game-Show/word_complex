const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

/**
 * Fetch the admin-selected stories (titles only) for the picker.
 * Returns an array of { storyId, title, category }.
 */
export async function fetchActiveStories() {
  const response = await fetch(`${API_BASE}/stories/active`);

  if (!response.ok) {
    throw new Error(`Failed to fetch active stories: ${response.status}`);
  }

  const payload = await response.json();
  return payload?.data ?? [];
}
