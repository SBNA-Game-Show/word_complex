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

const E2E_AUTH_ACTIONS = Object.freeze({
  EMAIL_SIGN_IN: "email-sign-in",
  EMAIL_SIGN_UP: "email-sign-up",
  GOOGLE_SIGN_IN: "google-sign-in",
});

function readE2EAuthConfig() {
  if (typeof window === "undefined") {
    return {};
  }

  return window.__WORD_COMPLEX_E2E_AUTH__ ?? {};
}

function recordE2EAuthCall(action, payload) {
  if (typeof window === "undefined") {
    return;
  }

  const currentCalls = Array.isArray(window.__WORD_COMPLEX_E2E_AUTH_CALLS__)
    ? window.__WORD_COMPLEX_E2E_AUTH_CALLS__
    : [];

  window.__WORD_COMPLEX_E2E_AUTH_CALLS__ = [
    ...currentCalls,
    {
      action,
      payload: payload ?? null,
    },
  ];
}

function waitForE2EAuthDelay(delayMs) {
  const safeDelay = Number(delayMs);

  if (!Number.isFinite(safeDelay) || safeDelay <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.setTimeout(resolve, safeDelay);
  });
}

function createE2EAuthError(failure) {
  const error = new Error(failure?.message ?? "E2E authentication failed.");

  if (failure?.code) {
    error.code = failure.code;
  }

  return error;
}

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

  const runE2EAuthFlow = useCallback(
    async (action, payload, defaultUser) => {
      const config = readE2EAuthConfig();

      recordE2EAuthCall(action, payload);

      await waitForE2EAuthDelay(config.delayMsByAction?.[action]);

      const failure = config.failureByAction?.[action];

      if (failure) {
        throw createE2EAuthError(failure);
      }

      return signInWithE2EUser({
        ...defaultUser,
        ...(config.userByAction?.[action] ?? {}),
      });
    },
    [signInWithE2EUser],
  );

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
    (credentials) => {
      const normalizedCredentials = {
        ...credentials,
        email: credentials?.email?.trim() ?? "",
      };

      if (E2E_AUTH_BYPASS) {
        return runAuthAction(() =>
          runE2EAuthFlow(
            E2E_AUTH_ACTIONS.EMAIL_SIGN_IN,
            normalizedCredentials,
            {
              id: "e2e-email-user",
              name: "Email Reader",
              nickname: "Email",
              username: normalizedCredentials.email,
              role: "Reader",
              isGuest: false,
            },
          ),
        );
      }

      return runAuthAction(() => loginWithEmail(normalizedCredentials));
    },
    [runAuthAction, runE2EAuthFlow],
  );

  const signUp = useCallback(
    (account) => {
      const normalizedAccount = {
        ...account,
        name: account?.name?.trim() ?? "",
        email: account?.email?.trim() ?? "",
      };

      if (E2E_AUTH_BYPASS) {
        const displayName = normalizedAccount.name || "New Reader";

        return runAuthAction(() =>
          runE2EAuthFlow(E2E_AUTH_ACTIONS.EMAIL_SIGN_UP, normalizedAccount, {
            id: "e2e-signup-user",
            name: displayName,
            nickname: displayName.split(/\s+/)[0] || "Reader",
            username: normalizedAccount.email,
            role: "Reader",
            isGuest: false,
          }),
        );
      }

      return runAuthAction(() => signUpWithEmail(normalizedAccount));
    },
    [runAuthAction, runE2EAuthFlow],
  );

  const loginWithGoogle = useCallback(() => {
    if (E2E_AUTH_BYPASS) {
      return runAuthAction(() =>
        runE2EAuthFlow(
          E2E_AUTH_ACTIONS.GOOGLE_SIGN_IN,
          {},
          {
            id: "e2e-google-user",
            name: "Google Reader",
            nickname: "Google",
            username: "google-reader@example.test",
            role: "Reader",
            isGuest: false,
          },
        ),
      );
    }

    return runAuthAction(() => signInWithGoogle());
  }, [runAuthAction, runE2EAuthFlow]);

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
