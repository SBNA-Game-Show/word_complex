import { useState } from "react";
import { demoLoginHint, adminLoginHint } from "../auth/fakeAuthClient";
import { useAuth } from "../auth/AuthContext";
import BackgroundDecor from "./BackgroundDecor";

export default function LoginPage() {
  const { clearError, error, isLoading, login, signUp } = useAuth();
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState(demoLoginHint.username);
  const [password, setPassword] = useState(demoLoginHint.password);
  const isSignUp = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (isSignUp) {
        await signUp({ name, nickname, username, password });
      } else {
        await login({ username, password });
      }
    } catch {
      // The auth provider owns the message shown in the form.
    }
  }

  function fillDemoLogin() {
    setMode("signin");
    clearError();
    setUsername(demoLoginHint.username);
    setPassword(demoLoginHint.password);
  }

  // TEMPORARY — fills the hardcoded admin credentials. Remove once real auth.
  function fillAdminLogin() {
    setMode("signin");
    clearError();
    setUsername(adminLoginHint.username);
    setPassword(adminLoginHint.password);
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    clearError();

    if (nextMode === "signin") {
      setUsername(demoLoginHint.username);
      setPassword(demoLoginHint.password);
    } else {
      setName("");
      setNickname("");
      setUsername("");
      setPassword("");
    }
  }

  return (
    <main className="login-page">
      <BackgroundDecor />

      <section className="login-shell" aria-labelledby="login-title">
        <div className="login-copy">
          <span className="login-logo" aria-hidden="true">W</span>
          <p className="eyebrow">Prototype sign in</p>
          <div className="login-copy-swap" key={`copy-${mode}`}>
            <h1 id="login-title">
              {isSignUp ? "Create your" : "Welcome back,"} <span>word hero!</span>
            </h1>
            <p>
              This is a fake auth flow for testing the interface. New accounts
              only live in memory while the page is open.
            </p>
          </div>
          <div className="login-sample" aria-label="Demo credentials">
            <span>Demo</span>
            <strong>{demoLoginHint.username}</strong>
            <span>/</span>
            <strong>{demoLoginHint.password}</strong>
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
              <>
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

                <label className="field">
                  <span>Nickname</span>
                  <input
                    autoComplete="nickname"
                    name="nickname"
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="Ace"
                    type="text"
                    value={nickname}
                  />
                </label>
              </>
            ) : null}

            <label className="field">
              <span>Username</span>
              <input
                autoComplete="username"
                name="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder={isSignUp ? "choose-a-name" : "anthony"}
                type="text"
                value={username}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isSignUp ? "4+ characters" : "demo123"}
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
                ? "Create player"
                : "Start learning"}
            <span className="btn-arrow" aria-hidden="true">&rarr;</span>
          </button>

          <div className="auth-footer" key={`footer-${mode}`}>
          {!isSignUp ? (
            <>
              <button className="btn-ghost login-demo-fill" type="button" onClick={fillDemoLogin}>
                Use demo login
              </button>
              {/* TEMPORARY admin shortcut — remove once real auth is wired. */}
              <button
                className="btn-ghost login-demo-fill"
                type="button"
                onClick={fillAdminLogin}
                style={{ marginTop: 8 }}
              >
                Use admin
              </button>
            </>
          ) : (
            <p className="signup-note">
              Temporary only. Refreshing the browser removes this prototype account.
            </p>
          )}
          </div>
        </form>
      </section>
    </main>
  );
}
