// Firebase app initialization. Reads the web config from Vite env vars
// (see client/.env.local). Exports a single shared `auth` instance with
// local persistence so a signed-in session survives a page refresh.
import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const isE2EAuthBypass = import.meta.env.VITE_E2E_AUTH_BYPASS === "true";

const firebaseConfig = isE2EAuthBypass
  ? {
      apiKey: "e2e-auth-bypass",
      authDomain: "e2e-auth-bypass.local",
      projectId: "e2e-auth-bypass",
      storageBucket: "e2e-auth-bypass.appspot.com",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:e2eauthbypass",
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Firestore holds the admin flag at users/{uid}/private/account.isAdmin. The
// instance is created lazily; it makes no network call until the first read.
export const db = getFirestore(app);

// Keep the user signed in across refreshes. This returns a promise; firing it
// at module load is fine because Firebase queues auth calls until it settles.
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Persistence can fail in private-mode / restricted storage browsers. Auth
  // still works for the current tab, so we swallow this rather than crash boot.
});
