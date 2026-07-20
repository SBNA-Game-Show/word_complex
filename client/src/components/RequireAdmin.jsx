import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { fetchIsAdmin } from "../auth/adminClient";

// E2E runs bypass real auth entirely, so the gate can't read Firestore. Admin
// status instead comes from an optional injected localStorage flag:
//   absent   → allow  (existing admin specs open /admin directly, no login)
//   "false"  → deny   (exercises the not-authorized path)
// This branch is dead in production, where VITE_E2E_AUTH_BYPASS is never set.
const E2E_AUTH_BYPASS = import.meta.env.VITE_E2E_AUTH_BYPASS === "true";

function readE2EAdmin() {
  try {
    const flag = window.localStorage.getItem("wc:e2eIsAdmin");
    return flag === null ? true : flag === "true";
  } catch {
    return true;
  }
}

// Route guard for the admin surface (/admin, /tokenized-editor). Renders its
// children only once the signed-in user is confirmed as an admin; everyone else
// (logged out, or a non-admin) gets a friendly "not authorized" screen. This is
// UX only — the server independently enforces admin access on every admin API
// call, so hiding the page is not the security boundary.
export default function RequireAdmin({ children }) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  // "checking" until we have a definitive answer, then "allowed" | "denied".
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    if (E2E_AUTH_BYPASS) {
      setStatus(readE2EAdmin() ? "allowed" : "denied");
      return undefined;
    }

    // Wait for Firebase to restore the session before deciding.
    if (isInitializing) {
      setStatus("checking");
      return undefined;
    }

    if (!isAuthenticated) {
      setStatus("denied");
      return undefined;
    }

    let active = true;
    setStatus("checking");
    fetchIsAdmin(user?.id).then((ok) => {
      if (active) setStatus(ok ? "allowed" : "denied");
    });

    return () => {
      active = false;
    };
  }, [isInitializing, isAuthenticated, user?.id]);

  if (status === "checking") {
    return (
      <div className="auth-splash" role="status" aria-live="polite" data-testid="admin-checking">
        <p className="splash-word">Word Complex</p>
        <p className="splash-sub">Checking your access…</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="auth-splash" data-testid="admin-denied">
        <p className="splash-word">Not authorized</p>
        <p className="splash-sub">This area is for administrators only.</p>
        <a className="back-button" href="/">← Back to Word Complex</a>
      </div>
    );
  }

  return children;
}
