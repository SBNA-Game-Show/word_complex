import { useState } from "react";
import BackgroundDecor from "./BackgroundDecor";
import { useAuth } from "../auth/AuthContext";
import { useProgress } from "../progress";
import UserBadge from "./UserBadge";
import "./CharacterSelect.css";

// The roster of pickable reading buddies. The image lives in /characters/<id>.png
// and the colors come from the existing game palette so accents stay on-brand.
export const CHARACTERS = [
  { id: "tomely",  name: "Tomely",  tag: "The Wise",     c: "#7aa8ff", c2: "#3155c7" },
  { id: "sprout",  name: "Sprout",  tag: "The Kind",     c: "#7bd17b", c2: "#46c97a" },
  { id: "bubbles", name: "Bubbles", tag: "The Splashy",  c: "#7fdcef", c2: "#2fb6d6" },
  { id: "cap",     name: "Cap",     tag: "The Brave",    c: "#ff8a8a", c2: "#ef4444" },
  { id: "luna",    name: "Luna",    tag: "The Magical",  c: "#b89cff", c2: "#7a5bd6" },
  { id: "bolt",    name: "Bolt",    tag: "The Curious",  c: "#cfe9ef", c2: "#8fbdd1" },
  { id: "comet",   name: "Comet",   tag: "The Sparkly",  c: "#ffe066", c2: "#ffb300" },
  { id: "berry",   name: "Berry",   tag: "The Sweet",    c: "#ff9bb4", c2: "#ff4f7a" },
];

export default function CharacterSelect({ selectedId, onSelect, onBack }) {
  const { logout, user } = useAuth();
  const { stars, isOwned, priceOf, milestones, buyCharacter } = useProgress();
  const [pendingId, setPendingId] = useState(null);
  const [notice, setNotice] = useState("");

  const selected = CHARACTERS.find((character) => character.id === selectedId) ?? null;

  // Which streak day gifts this character, if any (inverse of the milestone map).
  const milestoneDayFor = (id) => {
    const entry = Object.entries(milestones).find(([, giftId]) => giftId === id);
    return entry ? Number(entry[0]) : null;
  };

  async function handleBuy(character) {
    setNotice("");
    setPendingId(character.id);
    try {
      await buyCharacter(character.id);
      // A freshly bought buddy becomes the active one right away.
      onSelect(character.id);
      setNotice(`${character.name} is yours! ✨`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setPendingId(null);
    }
  }

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
        <span className="cs-star-pill">
          <span aria-hidden="true">⭐</span> {stars}
        </span>
        <UserBadge user={user} onLogout={logout} />
      </header>

      <section className="cs-intro">
        <p className="eyebrow">Reading Adventures</p>
        <h2>
          Who&rsquo;s coming on your <span className="rainbow">adventure</span>?
        </h2>
        <p className="cs-intro-text">
          Pick a buddy you own, buy a new one with your stars, or keep your
          streak going to unlock the special ones!
        </p>
        {notice && <p className="cs-notice">{notice}</p>}
      </section>

      <section className="cs-stage" aria-label="Characters">
        <div className="cs-stage-floor" aria-hidden="true" />
        <div className="cs-row">
          {CHARACTERS.map((character, index) => {
            const owned = isOwned(character.id);
            const isSelected = owned && character.id === selectedId;
            const price = priceOf(character.id);
            const milestoneDay = milestoneDayFor(character.id);
            const canAfford = price != null && stars >= price;
            const isPending = pendingId === character.id;

            const cardStyle = {
              "--c": character.c,
              "--c2": character.c2,
              "--enter-delay": `${0.18 + index * 0.09}s`,
            };

            const stage = (
              <span className="character-stage">
                <span className="character-glow" aria-hidden="true" />
                <img
                  className="character-img"
                  src={`/characters/${character.id}.webp`}
                  alt={character.name}
                  draggable="false"
                />
                <span className="character-disc" aria-hidden="true" />
                {!owned && (
                  <span className="character-lock" aria-hidden="true">
                    🔒
                  </span>
                )}
              </span>
            );

            const meta = (
              <span className="character-meta">
                <span className="character-name">{character.name}</span>
                <span className="character-tag">{character.tag}</span>
              </span>
            );

            // Owned buddies work exactly like before: tap to pick.
            if (owned) {
              return (
                <button
                  key={character.id}
                  type="button"
                  className={`character-card${isSelected ? " is-selected" : ""}`}
                  style={cardStyle}
                  onClick={() => onSelect(character.id)}
                  aria-pressed={isSelected}
                >
                  {stage}
                  {meta}
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
            }

            // Locked and for sale: show a price and a buy button.
            if (price != null) {
              return (
                <div
                  key={character.id}
                  className={`character-card is-locked${canAfford ? "" : " cant-afford"}`}
                  style={cardStyle}
                >
                  {stage}
                  {meta}
                  <button
                    type="button"
                    className="character-buy"
                    disabled={!canAfford || isPending}
                    onClick={() => handleBuy(character)}
                  >
                    {isPending ? (
                      "Buying…"
                    ) : (
                      <>
                        Buy · {price} <span aria-hidden="true">⭐</span>
                      </>
                    )}
                  </button>
                </div>
              );
            }

            // Locked and gifted at a streak milestone: show the goal.
            return (
              <div
                key={character.id}
                className="character-card is-locked"
                style={cardStyle}
              >
                {stage}
                {meta}
                <span className="character-locked-note">
                  {milestoneDay ? `Reach day ${milestoneDay}` : "Locked"}
                </span>
              </div>
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
