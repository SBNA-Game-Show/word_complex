import BackgroundDecor from "./BackgroundDecor";
import { useAuth } from "../auth/AuthContext";
import UserBadge from "./UserBadge";

export default function AboutPage({ onBack, onPlay }) {
  const { logout, user } = useAuth();

  return (
    <main className="about-page">
      <BackgroundDecor />

      <header className="htp-header">
        <div className="htp-nav-left">
          <button className="back-button" type="button" onClick={onBack}>
            <span className="back-arrow" aria-hidden="true">&larr;</span>
            Back
          </button>
          <div className="header-titles">
            <p className="eyebrow">About</p>
            <h1>Word Complex</h1>
          </div>
        </div>
        <UserBadge user={user} onLogout={logout} />
      </header>

      <section className="about-body">
        <div className="about-hero">
          <p className="eyebrow">Reading Adventures</p>
          <h2>Build stronger readers through playful word puzzles.</h2>
          <p>
            Word Complex turns reading practice into quick, colorful challenges
            that help learners understand vocabulary, sentence order, context,
            and story structure.
          </p>
          <button className="btn-primary" type="button" onClick={onPlay}>
            Play now
            <span className="btn-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </div>

        <div className="about-grid">
          <article className="about-card">
            <span className="about-card-icon">1</span>
            <h3>Practice with purpose</h3>
            <p>Each game focuses on a reading skill learners can reuse in real passages.</p>
          </article>
          <article className="about-card">
            <span className="about-card-icon">2</span>
            <h3>Short, friendly rounds</h3>
            <p>Games are designed to feel approachable, repeatable, and easy to jump into.</p>
          </article>
          <article className="about-card">
            <span className="about-card-icon">3</span>
            <h3>Progress feels visible</h3>
            <p>Scores, attempts, and stars give learners feedback as they keep improving.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
