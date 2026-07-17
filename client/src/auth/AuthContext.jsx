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

const E2E_AUTH_BYPASS = import.meta.env.VITE_E2E_AUTH_BYPASS === "true";

const E2E_USER = {
  id: "e2e-user",
  name: "E2E Reader",
  nickname: "E2E",
  username: "e2e@example.test",
  role: "Test Reader",
  stars: 0,
  isGuest: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  // True until Firebase reports the restored session for the first time, so we
  // can avoid flashing the login screen to an already-signed-in user.
  const [isInitializing, setIsInitializing] = useState(!E2E_AUTH_BYPASS);

  // The single source of truth for who is signed in: Firebase tells us via
  // onAuthStateChanged after sign-in, sign-out, and on initial page load.
  useEffect(() => {
    if (E2E_AUTH_BYPASS) {
      setIsInitializing(false);
      return undefined;
    }

    const unsubscribe = subscribeToAuth((mappedUser) => {
      setUser(mappedUser);
      setStatus(mappedUser ? "authenticated" : "idle");
      setIsInitializing(false);
    });

    return unsubscribe;
  }, []);

  const signInWithE2EUser = useCallback((overrides = {}) => {
    const nextUser = {
      ...E2E_USER,
      ...overrides,
    };

    setUser(nextUser);
    setStatus("authenticated");
    setError("");
    setIsInitializing(false);

    return Promise.resolve(nextUser);
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
    [runAuthAction],
  );

  const signUp = useCallback(
    (account) => runAuthAction(() => signUpWithEmail(account)),
    [runAuthAction],
  );

  const loginWithGoogle = useCallback(
    () => runAuthAction(() => signInWithGoogle()),
    [runAuthAction],
  );

  const loginAsGuest = useCallback(() => {
    if (E2E_AUTH_BYPASS) {
      return signInWithE2EUser();
    }

    return runAuthAction(() => signInAsGuest());
  }, [runAuthAction, signInWithE2EUser]);

  const clearError = useCallback(() => setError(""), []);

  const logout = useCallback(async () => {
    setError("");

    // E2E AUTH BYPASS:
    // The E2E user exists only in React state and is not registered with
    // Firebase. Clear that local test user directly so Playwright can verify
    // logout and session-reset behaviour without changing production auth.
    if (E2E_AUTH_BYPASS) {
      setUser(null);
      setStatus("idle");
      setIsInitializing(false);
      return;
    }

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
    ],
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
