// Reads the admin flag for a user from Firestore. Admin status lives at
// users/{uid}/private/account.isAdmin (set only via the Firebase console or the
// Admin SDK — clients cannot write it, per the Firestore security rules). This is
// used by the client gate for UX; the server independently verifies the same flag.
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

// Resolve whether the given uid is an admin. Returns false for a missing uid, a
// missing/incomplete doc, or any read error — access is denied unless we can
// positively confirm isAdmin === true.
export async function fetchIsAdmin(uid) {
  if (!uid) return false;

  try {
    const snap = await getDoc(doc(db, "users", uid, "private", "account"));
    return snap.exists() && snap.data().isAdmin === true;
  } catch {
    return false;
  }
}
