import { useState } from "react";
import { useAuth } from "./AuthContext";
import BackgroundDecor from "../components/BackgroundDecor";
import "./LoginPage.css";

export default function LoginPage() {
  const {
    clearError,
    error,
    isLoading,
    login,
    loginAsGuest,
    loginWithGoogle,
    signUp,
  } = useAuth();
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSignUp = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (isSignUp) {
        await signUp({ name, email, password });
      } else {
        await login({ email, password });
      }
    } catch {
      // The auth provider owns the message shown in the form.
    }
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle();
    } catch {
      // Error surfaced through the auth provider.
    }
  }

  async function handleGuest() {
    try {
      await loginAsGuest();
    } catch {
      // Error surfaced through the auth provider.
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    clearError();
    setName("");
    setEmail("");
    setPassword("");
  }

  return (
    <main className="login-page">
      <BackgroundDecor />

      <section className="login-shell" aria-labelledby="login-title">
        <div className="login-copy">
          <span className="login-logo" aria-hidden="true">W</span>
          <p className="eyebrow">Sign in to play</p>
          <div className="login-copy-swap" key={`copy-${mode}`}>
            <h1 id="login-title">
              {isSignUp ? "Create your" : "Welcome back,"} <span>word hero!</span>
            </h1>
            <p>
              Log in with Google, use your email, or jump straight in as a guest
              to try it out. Like it? Create an account to keep your progress.
            </p>
          </div>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-header" key={`header-${mode}`}>
            <div>
              <p className="eyebrow">Player portal</p>
              <h2>{isSignUp ? "Sign up" : "Sign in"}</h2>
            </div>
            <div className="login-avatar" aria-hidden="true">
              {isSignUp ? "N" : "A"}
            </div>
          </div>

          <div className="auth-social">
            <button
              className="btn-ghost auth-google"
              type="button"
              onClick={handleGoogle}
              disabled={isLoading}
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              className="btn-ghost auth-guest"
              type="button"
              onClick={handleGuest}
              disabled={isLoading}
            >
              Continue as guest
            </button>
          </div>

          <div className="auth-divider" aria-hidden="true">
            <span>or use email</span>
          </div>

          <div
            className={isSignUp ? "auth-tabs signup-active" : "auth-tabs"}
            aria-label="Authentication mode"
          >
            <button
              className={!isSignUp ? "auth-tab active" : "auth-tab"}
              type="button"
              onClick={() => switchMode("signin")}
            >
              Sign in
            </button>
            <button
              className={isSignUp ? "auth-tab active" : "auth-tab"}
              type="button"
              onClick={() => switchMode("signup")}
            >
              Sign up
            </button>
          </div>

          <div className="auth-fields" key={`fields-${mode}`}>
            {isSignUp ? (
              <label className="field">
                <span>Name</span>
                <input
                  autoComplete="name"
                  name="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Anthony"
                  type="text"
                  value={name}
                />
              </label>
            ) : null}

            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                autoComplete={isSignUp ? "new-password" : "current-password"}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isSignUp ? "6+ characters" : "Your password"}
                type="password"
                value={password}
              />
            </label>
          </div>

          {error ? <p className="login-error">{error}</p> : null}

          <button className="btn-primary login-submit" disabled={isLoading} type="submit">
            {isLoading
              ? isSignUp
                ? "Creating..."
                : "Checking..."
              : isSignUp
                ? "Create account"
                : "Start learning"}
            <span className="btn-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </form>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg className="auth-google-icon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
