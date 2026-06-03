import { createContext, useContext, useMemo, useState } from "react";
import { loginWithPassword, signUpWithPassword } from "./fakeAuthClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function login(credentials) {
    setStatus("loading");
    setError("");

    try {
      const authenticatedUser = await loginWithPassword(credentials);
      setUser(authenticatedUser);
      setStatus("authenticated");
      return authenticatedUser;
    } catch (loginError) {
      setUser(null);
      setStatus("idle");
      setError(loginError.message);
      throw loginError;
    }
  }

  async function signUp(account) {
    setStatus("loading");
    setError("");

    try {
      const authenticatedUser = await signUpWithPassword(account);
      setUser(authenticatedUser);
      setStatus("authenticated");
      return authenticatedUser;
    } catch (signUpError) {
      setUser(null);
      setStatus("idle");
      setError(signUpError.message);
      throw signUpError;
    }
  }

  function clearError() {
    setError("");
  }

  function logout() {
    setUser(null);
    setStatus("idle");
    setError("");
  }

  const value = useMemo(
    () => ({
      error,
      isAuthenticated: Boolean(user),
      isLoading: status === "loading",
      clearError,
      login,
      logout,
      signUp,
      user,
    }),
    [error, status, user]
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
