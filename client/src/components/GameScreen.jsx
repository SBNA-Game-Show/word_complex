import { useState } from "react";

import BackgroundDecor from "./BackgroundDecor";
import { getGame } from "../games";
import { useAuth } from "../auth/AuthContext";
import UserBadge from "./UserBadge";

/**
 * GameScreen
 * ----------
 * Shared wrapper used by all playable games in the Word Complex platform.
 *
 * Responsibilities:
 * - Render the fixed game header.
 * - Render the selected game component from the central game registry.
 * - Keep shared platform UI such as Back, game title, user badge, and logout.
 * - Apply game-specific wrapper classes so each game can be styled safely.
 *
 * Meaning Bridge note:
 * Meaning Bridge uses a ZIMJS canvas and benefits from a controlled zoom level.
 * The zoom is handled here, outside the game logic, through the CSS variable:
 *
 *   --meaning-bridge-zoom
 *
 * App.css reads this variable to resize only the Meaning Bridge canvas shell.
 * This avoids changing ZIMJS gameplay coordinates or the game logic itself.
 */
export default function GameScreen({ gameId, onBack }) {
  const { logout, user } = useAuth();

  // Get selected game metadata and component from client/src/games/index.js
  const game = getGame(gameId);
  const Game = game?.Component;

  // Used to generate scoped CSS classes such as:
  // game-screen-meaning-bridge
  // canvas-shell-meaning-bridge
  const gameClassName = gameId || "unknown-game";

  // Meaning Bridge has its own canvas containment and zoom controls.
  // Other games continue using the normal platform layout.
  const isMeaningBridge = gameId === "meaning-bridge";

  // Meaning Bridge zoom levels:
  // 0.9  = 90%
  // 1.0  = 100%
  // 1.15 = 115%
  //
  // These values are intentionally conservative so the canvas stays embedded
  // and does not take over the whole page.
  const [meaningBridgeCanvasZoom, setMeaningBridgeCanvasZoom] = useState(1);

  function zoomMeaningBridgeOut() {
    setMeaningBridgeCanvasZoom((current) =>
      Math.max(0.9, Number((current - 0.1).toFixed(1))),
    );
  }

  function zoomMeaningBridgeIn() {
    setMeaningBridgeCanvasZoom((current) =>
      Math.min(1.15, Number((current + 0.1).toFixed(1))),
    );
  }

  function resetMeaningBridgeZoom() {
    setMeaningBridgeCanvasZoom(1);
  }

  return (
    <main
      className={`game-screen game-screen-${gameClassName}`}
      data-testid={`game-screen-${gameId}`}
      style={
        isMeaningBridge
          ? {
              "--meaning-bridge-canvas-zoom": meaningBridgeCanvasZoom,
            }
          : undefined
      }
    >
      <BackgroundDecor />

      <header className="game-header">
        <button
          className="back-button"
          data-testid="game-back-button"
          type="button"
          onClick={onBack}
        >
          <span className="back-arrow" aria-hidden="true">
            &larr;
          </span>
          Back
        </button>

        <div className="header-titles">
          <p className="eyebrow">Now playing</p>
          <h1>{game?.title ?? "Game"}</h1>
        </div>

        <div className="game-header-meta" aria-hidden="true">
          <span>
            <span className="step-num">1</span> Drag
          </span>
          <span>
            <span className="step-num">2</span> Order
          </span>
          <span>
            <span className="step-num">3</span> Check
          </span>
        </div>

        {isMeaningBridge && (
          <div
            className="meaning-bridge-zoom-controls"
            aria-label="Meaning Bridge zoom controls"
          >
            <button
              type="button"
              onClick={zoomMeaningBridgeOut}
              aria-label="Zoom Meaning Bridge out"
              title="Zoom out"
            >
              −
            </button>

            <span aria-live="polite">
              {Math.round(meaningBridgeCanvasZoom * 100)}%
            </span>

            <button
              type="button"
              onClick={zoomMeaningBridgeIn}
              aria-label="Zoom Meaning Bridge in"
              title="Zoom in"
            >
              +
            </button>

            <button
              type="button"
              onClick={resetMeaningBridgeZoom}
              aria-label="Reset Meaning Bridge zoom"
              title="Reset zoom"
            >
              Reset
            </button>
          </div>
        )}

        <UserBadge user={user} onLogout={logout} />
      </header>

      <section
        className={`canvas-shell canvas-shell-${gameClassName}`}
        data-testid={`canvas-shell-${gameId}`}
      >
        {Game ? <Game /> : <p className="missing-game">Game not found.</p>}
      </section>
    </main>
  );
}
