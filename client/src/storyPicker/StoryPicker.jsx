import { useEffect, useState } from "react";

import BackgroundDecor from "../components/BackgroundDecor";
import { useAuth } from "../auth/AuthContext";
import UserBadge from "../components/UserBadge";
import { fetchActiveStories } from "./storyPickerService";
import "./StoryPicker.css";

// On-brand accent pairs reused from the character palette so story tiles feel
// like part of the same world. Assigned by index so any number of stories works.
const ACCENTS = [
  { c: "#7aa8ff", c2: "#3155c7" },
  { c: "#7bd17b", c2: "#46c97a" },
  { c: "#ffb300", c2: "#ff8a3d" },
  { c: "#b89cff", c2: "#7a5bd6" },
  { c: "#7fdcef", c2: "#2fb6d6" },
  { c: "#ff9bb4", c2: "#ff4f7a" },
];

/**
 * StoryPicker
 * -----------
 * Gate screen shown after login: the player picks ONE of the admin-selected
 * stories, and every game runs on that story for the session. Styled to match
 * CharacterSelect so it reads as the same family of screens.
 *
 * Props:
 *   currentStoryId?  - the story already chosen this session (highlights it)
 *   onConfirm(storyId) - proceed with the chosen story
 *   onBack?          - optional; when present (opened from the launcher) shows a
 *                      Back button. Omitted on the first-login gate.
 */
export default function StoryPicker({ currentStoryId = null, onConfirm, onBack }) {
  const { logout, user } = useAuth();

  const [stories, setStories] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [pickedId, setPickedId] = useState(currentStoryId);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchActiveStories();
        if (cancelled) return;
        setStories(data);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error.message || "Could not load stories.");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const picked = stories.find((story) => story.storyId === pickedId) ?? null;

  return (
    <main className="story-picker">
      <BackgroundDecor />
      <div className="sp-scene" aria-hidden="true">
        <div className="sp-grid-pattern" />
        <div className="sp-glow sp-glow--a" />
        <div className="sp-glow sp-glow--b" />
      </div>

      <header className="game-header">
        {onBack ? (
          <button className="back-button" type="button" onClick={onBack}>
            <span className="back-arrow" aria-hidden="true">&larr;</span>
            Back
          </button>
        ) : (
          <span className="back-button back-button--placeholder" aria-hidden="true" />
        )}
        <div className="header-titles">
          <p className="eyebrow">Choose your adventure</p>
          <h1>Pick a Story</h1>
        </div>
        <UserBadge user={user} onLogout={logout} />
      </header>

      <section className="sp-intro">
        <p className="eyebrow">Reading Adventures</p>
        <h2>
          Which <span className="rainbow">story</span> today?
        </h2>
        <p className="sp-intro-text">
          Pick one tale &mdash; every game plays with the story you choose.
        </p>
      </section>

      <section className="sp-stage" aria-label="Stories">
        {status === "loading" && (
          <p className="sp-state" role="status">Loading stories&hellip;</p>
        )}

        {status === "error" && (
          <p className="sp-state sp-state--error" role="alert">
            {errorMessage}
          </p>
        )}

        {status === "ready" && stories.length === 0 && (
          <p className="sp-state" role="status">
            No stories are active right now. Check back soon!
          </p>
        )}

        {status === "ready" && stories.length > 0 && (
          <div className="sp-row">
            {stories.map((story, index) => {
              const isSelected = story.storyId === pickedId;
              const accent = ACCENTS[index % ACCENTS.length];
              return (
                <button
                  key={story.storyId}
                  type="button"
                  className={`story-card${isSelected ? " is-selected" : ""}`}
                  style={{
                    "--c": accent.c,
                    "--c2": accent.c2,
                    "--enter-delay": `${0.18 + index * 0.09}s`,
                  }}
                  onClick={() => setPickedId(story.storyId)}
                  aria-pressed={isSelected}
                >
                  <span className="story-cover" aria-hidden="true">
                    <span className="story-cover-glyph">&#128214;</span>
                    {story.category && (
                      <span className="story-cover-tag">{story.category}</span>
                    )}
                  </span>
                  <span className="story-meta">
                    <span className="story-title">{story.title}</span>
                  </span>
                  <span className="story-pick">
                    {isSelected ? (
                      <>
                        <span className="story-check" aria-hidden="true">&#10003;</span>
                        Picked
                      </>
                    ) : (
                      "Pick this"
                    )}
                  </span>
                  {isSelected && <span className="story-ribbon">Chosen</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <footer className={`sp-footer${picked ? " is-active" : ""}`}>
        {picked ? (
          <>
            <p>
              <span className="sp-footer-dot" />
              Your story is <strong>{picked.title}</strong>
            </p>
            <button
              className="btn-primary sp-confirm"
              type="button"
              onClick={() => onConfirm(picked.storyId)}
            >
              Start reading
              <span className="btn-arrow" aria-hidden="true">&rarr;</span>
            </button>
          </>
        ) : (
          <p>
            <span className="sp-footer-dot muted" />
            No story picked yet &mdash; choose one above.
          </p>
        )}
      </footer>
    </main>
  );
}
