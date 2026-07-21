// Attaches the signed-in user's Firebase ID token to admin-only API requests,
// WITHOUT touching any of the admin feature's own code. It wraps window.fetch
// once at startup and adds an Authorization: Bearer header to requests the
// server gates (see server/middleware/requireAdmin.js):
//   - anything under /api/v1/admin/
//   - writes to /api/v1/stories/tokenized/ (the tokenized-story editor)
// Everything else passes straight through untouched.
import { auth } from "./firebaseConfig";

const ADMIN_API_PATTERN = /\/api\/v1\/admin\//;
const TOKENIZED_WRITE_PATTERN = /\/api\/v1\/stories\/tokenized\//;

function urlOf(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;
  return "";
}

function methodOf(input, init) {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.method.toUpperCase();
  }
  return "GET";
}

function needsAuth(url, method) {
  if (ADMIN_API_PATTERN.test(url)) return true;
  if (TOKENIZED_WRITE_PATTERN.test(url) && method !== "GET" && method !== "HEAD") {
    return true;
  }
  return false;
}

let installed = false;

export function installAdminAuthInterceptor() {
  if (installed || typeof window === "undefined" || typeof window.fetch !== "function") {
    return;
  }
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    if (!needsAuth(urlOf(input), methodOf(input, init))) {
      return originalFetch(input, init);
    }

    // Not signed in (includes the E2E bypass user, which isn't a real Firebase
    // account) — send as-is and let the server reject it if it must.
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return originalFetch(input, init);
    }

    let token;
    try {
      token = await currentUser.getIdToken();
    } catch {
      return originalFetch(input, init);
    }

    // Merge our header without clobbering a caller-supplied Authorization.
    if (typeof Request !== "undefined" && input instanceof Request) {
      const headers = new Headers(input.headers);
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return originalFetch(new Request(input, { headers }));
    }

    const headers = new Headers(init?.headers || {});
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return originalFetch(input, { ...init, headers });
  };
}
