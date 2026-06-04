import BackgroundDecor from "./BackgroundDecor";
import { useAuth } from "../auth/AuthContext";
import UserBadge from "./UserBadge";
import { useEffect } from "react";
import { getFillInBlanks } from "../services/api";

export default function Launcher({ onStart, onAbout, onHowToPlay }) {
  const { logout, user } = useAuth();

  const games = [
    {
      id: "sentence-builder",
      number: "01",
      className: "art-meadow",
      title: "Passage Reconstruction",
      description: "Snap word clouds together to rebuild the passage.",
    },
    {
      id: "word-match",
      number: "02",
      title: "Word Match",
      description: "Match silly clues with their vocabulary buddies.",
    },
    {
      id: "context-cloze-quest",
      number: "03",
      className: "art-night",
      title: "Context Cloze Quest",
      description: "Choose the best missing words from the context.",
    },
    {
      id: "word-hunt",
      number: "04",
      title: "Word Hunt",
      description: "Search for hidden words and collect bright clues.",
    },
  ];

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
            <button className="btn-ghost" type="button" onClick={onAbout}>About</button>
          </div>
        </div>
      </section>

      <section className="games-row" aria-label="Game previews">
        {games.map((game) => (
          <article className={`preview-card ${game.className ?? ""}`} key={game.id}>
            <span className="card-number">{game.number}</span>
            <div className="preview-art" aria-hidden="true" />
            <div className="preview-content">
              <span className="game-pill">Playable</span>
              <h2>{game.title}</h2>
              <p>{game.description}</p>
              <div className="preview-actions">
                <button className="preview-cta" type="button" onClick={() => onStart(game.id)}>
                  Start playing
                  <span className="btn-arrow" aria-hidden="true">&rarr;</span>
                </button>
                <button className="preview-help" type="button" onClick={() => onHowToPlay(game.id)}>
                  How to play
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
