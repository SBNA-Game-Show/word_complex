/**
 * progressService.js
 * --------------------------------------------------------------------------
 * Frontend access to the daily-streak API. Same fetch + VITE_API_URL pattern
 * as the other services (src/services/, leaderboard/leaderboardService.js).
 * This is the ONLY place the client talks HTTP for streak data — the rest of
 * the app goes through useProgress().
 * --------------------------------------------------------------------------
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch with a few retries, tuned for the Render backend's cold start: while
 * the dyno wakes it can throw a network error or return a 5xx, and a short
 * backoff lets that self-heal. Client errors (4xx) are NOT retried — they're
 * returned as-is so the caller can surface the real message.
 */
async function fetchWithRetry(url, options = {}, attempts = 3, backoffMs = 1500) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const isLast = attempt === attempts - 1;
    try {
      const response = await fetch(url, options);
      if (response.status >= 500 && !isLast) {
        await delay(backoffMs * (attempt + 1));
        continue;
      }
      return response;
    } catch (networkError) {
      lastError = networkError;
      if (!isLast) await delay(backoffMs * (attempt + 1));
    }
  }
  throw lastError ?? new Error("Request failed");
}

async function readJson(response, fallbackMessage) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }
  return data;
}

/**
 * Fire-and-forget nudge to wake the (possibly cold) backend as early as
 * possible, so it's warm by the time the user has signed in. Errors are
 * swallowed — this is purely a head start, not a dependency.
 */
export function warmUp() {
  fetch(`${API_BASE}/progress/config`).catch(() => {});
}

/** Static economy config for rendering the ladder, prices, and gifts. */
export async function fetchProgressConfig() {
  const response = await fetchWithRetry(`${API_BASE}/progress/config`);
  const json = await readJson(response, "Failed to load streak config");
  return json.data;
}

/**
 * Register today's visit: continues (or resets) the streak and awards stars.
 * Returns the fresh state plus what just happened (awardedStars, isNewDay,
 * giftedCharacters) so the UI can celebrate it.
 */
export async function registerVisit(uid) {
  const response = await fetchWithRetry(`${API_BASE}/progress/visit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid }),
  });
  const json = await readJson(response, "Failed to register your visit");
  return json.data;
}

/** Spend stars to unlock a character. Returns the updated state. */
export async function buyCharacter(uid, characterId) {
  const response = await fetch(`${API_BASE}/progress/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, characterId }),
  });
  const json = await readJson(response, "Failed to buy character");
  return json.data;
}
