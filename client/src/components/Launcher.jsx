import BackgroundDecor from "./BackgroundDecor";
import { useAuth } from "../auth/AuthContext";
import UserBadge from "./UserBadge";
import { useEffect } from "react";
import { getFillInBlanks } from "../services/api";

export default function Launcher({ onStart, onHowToPlay }) {
  const { logout, user } = useAuth();

  useEffect(() => {
  getFillInBlanks()
    .then(console.log)
    .catch(console.error);
  }, []);

  return (
    <main className="launcher">
      <BackgroundDecor />

      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">W</span>
          <span>Word Complex</span>
        </div>
        <div className="topbar-actions">
          <div className="streak-pills" aria-label="Today">
            <span className="streak-pill sun"><span className="dot" /> 5 day streak</span>
            <span className="streak-pill"><span className="dot" /> {user?.role ?? "Reader"}</span>
            <span className="streak-pill alt"><span className="dot" /> {user?.stars ?? 0} stars</span>
          </div>
          <UserBadge user={user} onLogout={logout} />
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Reading Adventures</p>
          <h1>
            Let&rsquo;s build <span className="rainbow">amazing</span>
            <br />
            <span className="underline-pop">stories</span> together!
          </h1>
          <p className="hero-description">
            Drag fun word clouds into the right order, finish the sentence, and
            earn shiny stars on every magical round.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" type="button" onClick={onStart}>
              Play now
              <span className="btn-arrow" aria-hidden="true">&rarr;</span>
            </button>
            <button className="btn-ghost" type="button" onClick={onHowToPlay}>How to play</button>
          </div>
        </div>
      </section>

      <section className="games-row" aria-label="Game previews">
        <button className="preview-card art-meadow" type="button" onClick={() => onStart("sentence-builder")}>
          <span className="card-number">01</span>
          <div className="preview-art" aria-hidden="true" />
          <div className="preview-content">
            <span className="game-pill">Featured</span>
            <h2>Passage Reconstruction</h2>
            <p>Snap word clouds together to rebuild the passage.</p>
            <span className="preview-cta">
              Start playing
              <span className="btn-arrow" aria-hidden="true">&rarr;</span>
            </span>
          </div>
        </button>

        <article className="preview-card preview-card-locked art-sea">
          <span className="lock-badge"><span className="lock" /> Soon</span>
          <span className="card-number">02</span>
          <div className="preview-art" aria-hidden="true" />
          <div className="preview-content">
            <span className="game-pill locked">Coming soon</span>
            <h2>Word Match</h2>
            <p>Match silly clues with their vocabulary buddies.</p>
          </div>
        </article>

        <button
          className="preview-card art-night"
          type="button"
          onClick={() => onStart("context-cloze-quest")}
        >
          <span className="card-number">03</span>
          <div className="preview-art" aria-hidden="true" />
          <div className="preview-content">
            <span className="game-pill">Playable</span>
            <h2>Context Cloze Quest</h2>
            <p>
              Choose the best missing words from the context.
            </p>

            <span className="preview-cta">
              Start playing
              <span className="btn-arrow" aria-hidden="true">
                &rarr;
              </span>
            </span>
          </div>
        </button>

        <article className="preview-card preview-card-locked art-hunt">
          <span className="lock-badge"><span className="lock" /> Soon</span>
          <span className="card-number">04</span>
          <div className="preview-art" aria-hidden="true" />
          <div className="preview-content">
            <span className="game-pill locked">Coming soon</span>
            <h2>Word Hunt</h2>
            <p>Search for hidden words and collect bright clues.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
