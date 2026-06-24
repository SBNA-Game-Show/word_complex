import BackgroundDecor from "./BackgroundDecor";
import { useAuth } from "../auth/AuthContext";
import UserBadge from "./UserBadge";
import "./CharacterSelect.css";

// The roster of pickable reading buddies. The image lives in /characters/<id>.png
// and the colors come from the existing game palette so accents stay on-brand.
export const CHARACTERS = [
  { id: "sprout",  name: "Sprout",  tag: "The Kind",     c: "#7bd17b", c2: "#46c97a" },
  { id: "bubbles", name: "Bubbles", tag: "The Splashy",  c: "#7fdcef", c2: "#2fb6d6" },
  { id: "cap",     name: "Cap",     tag: "The Brave",    c: "#ff8a8a", c2: "#ef4444" },
  { id: "tomely",  name: "Tomely",  tag: "The Wise",     c: "#7aa8ff", c2: "#3155c7" },
  { id: "luna",    name: "Luna",    tag: "The Magical",  c: "#b89cff", c2: "#7a5bd6" },
  { id: "bolt",    name: "Bolt",    tag: "The Curious",  c: "#cfe9ef", c2: "#8fbdd1" },
  { id: "comet",   name: "Comet",   tag: "The Sparkly",  c: "#ffe066", c2: "#ffb300" },
  { id: "berry",   name: "Berry",   tag: "The Sweet",    c: "#ff9bb4", c2: "#ff4f7a" },
];

export default function CharacterSelect({ selectedId, onSelect, onBack }) {
  const { logout, user } = useAuth();
  const selected = CHARACTERS.find((character) => character.id === selectedId) ?? null;

  return (
    <main className="character-select">
      <BackgroundDecor />
      <div className="cs-scene" aria-hidden="true">
        <div className="cs-grid-pattern" />
        <div className="cs-glow cs-glow--a" />
        <div className="cs-glow cs-glow--b" />
        <div className="cs-glow cs-glow--c" />
        <div className="cs-stars">
          <span className="cs-twinkle t1" />
          <span className="cs-twinkle t2" />
          <span className="cs-twinkle t3" />
          <span className="cs-twinkle t4" />
          <span className="cs-twinkle t5" />
          <span className="cs-twinkle t6" />
          <span className="cs-twinkle t7" />
          <span className="cs-twinkle t8" />
        </div>
      </div>

      <header className="game-header">
        <button className="back-button" type="button" onClick={onBack}>
          <span className="back-arrow" aria-hidden="true">&larr;</span>
          Back
        </button>
        <div className="header-titles">
          <p className="eyebrow">Choose your buddy</p>
          <h1>Pick a Character</h1>
        </div>
        <UserBadge user={user} onLogout={logout} />
      </header>

      <section className="cs-intro">
        <p className="eyebrow">Reading Adventures</p>
        <h2>
          Who&rsquo;s coming on your <span className="rainbow">adventure</span>?
        </h2>
        <p className="cs-intro-text">
          Hover to say hello, then tap a buddy to make them yours. They&rsquo;ll
          join you on every magical round!
        </p>
      </section>

      <section className="cs-stage" aria-label="Characters">
        <div className="cs-stage-floor" aria-hidden="true" />
        <div className="cs-row">
          {CHARACTERS.map((character, index) => {
            const isSelected = character.id === selectedId;
            return (
              <button
                key={character.id}
                type="button"
                className={`character-card${isSelected ? " is-selected" : ""}`}
                style={{
                  "--c": character.c,
                  "--c2": character.c2,
                  "--enter-delay": `${0.18 + index * 0.09}s`,
                }}
                onClick={() => onSelect(character.id)}
                aria-pressed={isSelected}
              >
                <span className="character-stage">
                  <span className="character-glow" aria-hidden="true" />
                  <img
                    className="character-img"
                    src={`/characters/${character.id}.webp`}
                    alt={character.name}
                    draggable="false"
                  />
                  <span className="character-disc" aria-hidden="true" />
                </span>
                <span className="character-meta">
                  <span className="character-name">{character.name}</span>
                  <span className="character-tag">{character.tag}</span>
                </span>
                <span className="character-pick">
                  {isSelected ? (
                    <>
                      <span className="character-check" aria-hidden="true">&#10003;</span>
                      Picked
                    </>
                  ) : (
                    "Pick me"
                  )}
                </span>
                {isSelected && <span className="character-ribbon">Yours</span>}
              </button>
            );
          })}
        </div>
      </section>

      <footer className={`cs-footer${selected ? " is-active" : ""}`}>
        {selected ? (
          <p>
            <span className="cs-footer-dot" />
            Your character is <strong>{selected.name}</strong> &mdash; {selected.tag}!
          </p>
        ) : (
          <p>
            <span className="cs-footer-dot muted" />
            No buddy picked yet &mdash; choose one above.
          </p>
        )}
      </footer>
    </main>
  );
}
