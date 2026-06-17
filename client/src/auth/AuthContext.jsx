import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  loginWithEmail,
  logout as firebaseLogout,
  signInAsGuest,
  signInWithGoogle,
  signUpWithEmail,
  subscribeToAuth,
  toFriendlyError,
} from "./firebaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  // True until Firebase reports the restored session for the first time, so we
  // can avoid flashing the login screen to an already-signed-in user.
  const [isInitializing, setIsInitializing] = useState(true);

  // The single source of truth for who is signed in: Firebase tells us via
  // onAuthStateChanged after sign-in, sign-out, and on initial page load.
  useEffect(() => {
    const unsubscribe = subscribeToAuth((mappedUser) => {
      setUser(mappedUser);
      setStatus(mappedUser ? "authenticated" : "idle");
      setIsInitializing(false);
    });

    return unsubscribe;
  }, []);

  // Wrap a Firebase auth action with shared loading/error handling. The user
  // state itself is set by the onAuthStateChanged subscription above.
  const runAuthAction = useCallback(async (action) => {
    setStatus("loading");
    setError("");

    try {
      return await action();
    } catch (authError) {
      setStatus((current) => (current === "loading" ? "idle" : current));
      setError(toFriendlyError(authError));
      throw authError;
    }
  }, []);

  const login = useCallback(
    (credentials) => runAuthAction(() => loginWithEmail(credentials)),
    [runAuthAction]
  );

  const signUp = useCallback(
    (account) => runAuthAction(() => signUpWithEmail(account)),
    [runAuthAction]
  );

  const loginWithGoogle = useCallback(
    () => runAuthAction(() => signInWithGoogle()),
    [runAuthAction]
  );

  const loginAsGuest = useCallback(
    () => runAuthAction(() => signInAsGuest()),
    [runAuthAction]
  );

  const clearError = useCallback(() => setError(""), []);

  const logout = useCallback(async () => {
    setError("");
    try {
      await firebaseLogout();
    } catch (logoutError) {
      setError(toFriendlyError(logoutError));
    }
  }, []);

  const value = useMemo(
    () => ({
      error,
      isAuthenticated: Boolean(user),
      isInitializing,
      isLoading: status === "loading",
      clearError,
      login,
      loginAsGuest,
      loginWithGoogle,
      logout,
      signUp,
      user,
    }),
    [
      error,
      isInitializing,
      status,
      user,
      clearError,
      login,
      loginAsGuest,
      loginWithGoogle,
      logout,
      signUp,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
