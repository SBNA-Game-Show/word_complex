/*
 * Firebase Admin SDK — used to authoritatively check admin access.
 *
 * The middleware verifies a caller's Firebase ID token and reads the admin flag
 * from Firestore at users/{uid}/private/account.isAdmin. The Admin SDK bypasses
 * Firestore security rules, so this is trusted server-side and cannot be spoofed
 * by a client (clients also cannot write isAdmin — enforced by the Firestore
 * security rules managed in the Firebase console).
 *
 * Credentials come from the FIREBASE_SERVICE_ACCOUNT_JSON env var: the full JSON
 * of a Firebase service-account key (Project settings → Service accounts →
 * Generate new private key), stored as a single-line string.
 *
 * Everything loads lazily - the firebase-admin subpath modules are required only
 * on the first admin request, not at import time. This keeps the credential
 * optional for non-admin routes and, importantly, avoids pulling firebase-admin's
 * ESM-only deps into Jest (which doesn't transpile node_modules) when suites load
 * app.js but never exercise an admin route. Uses the modular firebase-admin API
 * (v13+), where the legacy `admin.*` namespace (admin.credential / admin.apps) is
 * no longer exported.
 */
let sdk;
let app;

function loadSdk() {
  if (sdk) return sdk;

  const { initializeApp, getApps, cert } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");
  const { getFirestore } = require("firebase-admin/firestore");

  sdk = { initializeApp, getApps, cert, getAuth, getFirestore };
  return sdk;
}

function ensureApp() {
  if (app) return app;

  const { initializeApp, getApps, cert } = loadSdk();

  const existing = getApps();
  if (existing.length) {
    app = existing[0];
    return app;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is missing — required to verify admin access.",
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: ${err.message}`,
    );
  }

  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

function getAdminAuth() {
  return loadSdk().getAuth(ensureApp());
}

function getAdminFirestore() {
  return loadSdk().getFirestore(ensureApp());
}

module.exports = { getAdminAuth, getAdminFirestore };
