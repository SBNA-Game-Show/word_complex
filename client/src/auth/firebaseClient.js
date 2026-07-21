// Thin wrapper around Firebase Auth. This is the swappable "auth client" the
// rest of the app talks to through AuthContext — it hides Firebase specifics
// and maps Firebase users into the app's user shape.
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebaseConfig";

const googleProvider = new GoogleAuthProvider();

// Map a Firebase user into the shape the app's UI expects. Consumers read
// nickname / name / role / stars (all with fallbacks), so this must always
// return those fields. `stars` is 0 until we add server-side persistence.
export function mapFirebaseUser(fbUser) {
  if (!fbUser) return null;

  const name =
    fbUser.displayName?.trim() ||
    fbUser.email?.split("@")[0] ||
    "Guest";

  return {
    id: fbUser.uid,
    name,
    nickname: fbUser.isAnonymous ? "Guest" : name.split(" ")[0],
    username: fbUser.email ?? (fbUser.isAnonymous ? "guest" : fbUser.uid),
    role: fbUser.isAnonymous ? "Guest Reader" : "Reader",
    stars: 0,
    isGuest: Boolean(fbUser.isAnonymous),
  };
}

// Subscribe to auth state changes. Returns the unsubscribe function. The
// callback fires once on load with the restored session (or null).
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, (fbUser) => callback(mapFirebaseUser(fbUser)));
}

export async function signInWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider);
  return mapFirebaseUser(user);
}

export async function signInAsGuest() {
  const { user } = await signInAnonymously(auth);
  return mapFirebaseUser(user);
}

export async function loginWithEmail({ email, password }) {
  const { user } = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  return mapFirebaseUser(user);
}

export async function signUpWithEmail({ email, password, name }) {
  const { user } = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  const trimmedName = name?.trim();
  if (trimmedName) {
    await updateProfile(user, { displayName: trimmedName });
  }

  return mapFirebaseUser(user);
}

export async function logout() {
  const current = auth.currentUser;

  // Guests carry no saved progress, so discard the throwaway anonymous account
  // on logout rather than leaving it to clutter the Firebase user list. Both
  // paths fire onAuthStateChanged(null), returning the app to the login screen.
  if (current?.isAnonymous) {
    try {
      await deleteUser(current);
      return;
    } catch {
      // deleteUser can require a recent login; fall back to a plain sign-out
      // and let the console's 30-day auto-cleanup reap the account later.
    }
  }

  await signOut(auth);
}

// Translate Firebase's auth/* error codes into friendly, kid-appropriate
// messages. Falls back to the raw message for anything unmapped.
const friendlyMessages = {
  "auth/invalid-credential": "That email or password doesn't match. Try again.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/user-not-found": "We couldn't find an account with that email.",
  "auth/wrong-password": "That password isn't right. Try again.",
  "auth/email-already-in-use": "An account with that email already exists. Try signing in.",
  "auth/weak-password": "Pick a password with at least 6 characters.",
  "auth/missing-password": "Please enter a password.",
  "auth/popup-closed-by-user": "The Google sign-in window closed before finishing.",
  "auth/cancelled-popup-request": "The Google sign-in window closed before finishing.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and retry.",
  "auth/network-request-failed": "Network trouble. Check your connection and try again.",
  "auth/too-many-requests": "Too many tries. Wait a moment and try again.",
  "auth/operation-not-allowed": "That sign-in method isn't enabled yet. Enable it in the Firebase console.",
  "auth/admin-restricted-operation": "Guest sign-in isn't enabled yet. Turn on Anonymous auth in the Firebase console.",
};

export function toFriendlyError(error) {
  return friendlyMessages[error?.code] || error?.message || "Something went wrong. Please try again.";
}