import { useEffect, useRef, useState } from "react";

import { getGame } from "../games";
import { getSceneConfig } from "./sceneConfig";
import { subscribe } from "./sceneBus";
import { pickLine } from "./speechLines";
import CharacterHelper from "./CharacterHelper";
import "./GameScene.css";

// How long a speech bubble lingers before it starts leaving.
const SPEECH_MS = 1600;
// Duration of the pop-out animation (must match `speech-pop-out` in the CSS).
const SPEECH_OUT_MS = 300;

/**
 * GameScene
 * ---------
 * Reusable, config-driven game "environment" used when launching a game that has
 * an entry in sceneConfig.js (currently Passage Reconstruction / sentence-builder).
 *
 * Layout:
 *   - Full-screen illustrated background (from sceneConfig.background).
 *   - ZIM canvas area on the left — renders the game's component from the central
 *     registry (getGame(gameId).Component). That component is built with
 *     createZimGame, which already owns the ZIM Frame lifecycle: it initializes a
 *     single Frame on mount and disposes it on unmount, so no duplicate canvases
 *     are created when re-entering the game.
 *   - Helper character standing area on the right (CharacterHelper).
 *
 * Entrance animations are pure CSS and are triggered by toggling an `is-entered`
 * class one frame after mount (see GameScene.css for the keyframes/timing).
 */
export default function GameScene({ gameId, selectedCharacterId, onBack }) {
  const game = getGame(gameId);
  const Game = game?.Component;
  const config = getSceneConfig(gameId);

  // Resolve which character to show: the player's pick, else the scene default.
  const characterId = selectedCharacterId || config?.defaultCharacterId || "tomely";

  // `entered` flips to true one frame after mount so CSS transitions/animations
  // run from their "before" state into the "after" state.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Speech bubble shown beside the character. The ZIM game (running inside the
  // isolated canvas) emits "moods" on sceneBus when the player gets a round
  // right/wrong; we turn those into a randomized line the buddy "says".
  const [speech, setSpeech] = useState(null);
  const speechIdRef = useRef(0);
  const speechTimersRef = useRef([]);

  useEffect(() => {
    const clearTimers = () => {
      speechTimersRef.current.forEach(clearTimeout);
      speechTimersRef.current = [];
    };

    const unsubscribe = subscribe((mood) => {
      const text = pickLine(mood);
      if (!text) return;
      speechIdRef.current += 1;
      const id = speechIdRef.current;
      clearTimers();
      setSpeech({ id, text, mood, leaving: false });
      // Phase 1: after the dwell time, flip to "leaving" so the bubble plays
      // its pop-out animation. Phase 2: unmount once that animation finishes.
      speechTimersRef.current.push(
        setTimeout(() => {
          setSpeech((prev) => (prev && prev.id === id ? { ...prev, leaving: true } : prev));
        }, SPEECH_MS),
        setTimeout(() => {
          setSpeech((prev) => (prev && prev.id === id ? null : prev));
        }, SPEECH_MS + SPEECH_OUT_MS)
      );
    });
    return () => {
      unsubscribe();
      clearTimers();
    };
  }, []);

  return (
    <main
      className={`game-scene${entered ? " is-entered" : ""}`}
      style={{
        // ── ZIM canvas size + horizontal offset (tune in sceneConfig.js) ───
        "--scene-canvas-max-width": `${config?.canvas?.maxWidth ?? 760}px`,
        "--scene-canvas-offset-x": config?.canvas?.offsetX ?? "0px",
        // ── Background aspect ratio — drives the "cover" geometry that both
        //    the background and the character layer share, so the character
        //    stays anchored to the artwork on any display. ──────────────────
        "--scene-aspect": config?.backgroundAspect ?? 16 / 9,
      }}
    >
      {/* Full-screen illustrated background (slides in from the left). */}
      <div
        className="scene-bg"
        style={{ backgroundImage: `url(${config?.background ?? ""})` }}
        aria-hidden="true"
      />

      {/* Character layer — shares the EXACT cover geometry of `.scene-bg`, so
          the character is positioned relative to the artwork (sticks to the
          painted surface) rather than to the viewport. */}
      <div className="scene-surface" aria-hidden="true">
        <CharacterHelper
          characterId={characterId}
          character={config?.character}
          entered={entered}
          speech={speech}
        />
      </div>

      {/* Lightweight scene chrome overlaid on the environment. */}
      <header className="scene-topbar">
        <button className="back-button" type="button" onClick={onBack}>
          <span className="back-arrow" aria-hidden="true">
            &larr;
          </span>
          Back
        </button>
        <div className="scene-title">
          <p className="eyebrow">Now playing</p>
          <h1>{game?.title ?? "Game"}</h1>
        </div>
      </header>

      <div className="scene-stage">
        {/* Left: the ZIM canvas (fades in after the background settles). */}
        <section className="scene-canvas">
          <div className="scene-canvas-frame">
            {Game ? <Game /> : <p className="missing-game">Game not found.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
