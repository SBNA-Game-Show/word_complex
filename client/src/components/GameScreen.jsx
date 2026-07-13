import BackgroundDecor from "./BackgroundDecor";
import { getGame } from "../games";
import { useAuth } from "../auth/AuthContext";
import UserBadge from "./UserBadge";
import { useCanvasZoom } from "./useCanvasZoom";

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
 * Canvas zoom:
 * Every ZIMJS game gets +/- zoom controls (see useCanvasZoom), handled outside
 * the game logic through the CSS variable `--canvas-zoom`, which App.css applies
 * as a transform on the canvas. This resizes the canvas without touching ZIMJS
 * gameplay coordinates or the game logic itself.
 */
export default function GameScreen({ gameId, onBack }) {
  const { logout, user } = useAuth();

  const game = getGame(gameId);
  const Game = game?.Component;

  // Used to generate scoped CSS classes such as:
  // game-screen-meaning-bridge
  // canvas-shell-meaning-bridge
  const gameClassName = gameId || "unknown";

  // Manual canvas zoom (1 = 100%). Applied to every game via --canvas-zoom.
  const { zoom: canvasZoom, controls: zoomControls } = useCanvasZoom();

  return (
    <main
      className={`game-screen game-screen-${gameClassName}`}
      style={{ "--canvas-zoom": canvasZoom }}
      data-testid={`game-screen-${gameId}`}
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

        {zoomControls}

        <UserBadge user={user} onLogout={logout} />
      </header>

      <section
        className={`canvas-shell canvas-shell-${gameId || "unknown"}`}
        data-testid={`canvas-shell-${gameId}`}
      >
        {Game ? (
          // key on the uid: ZIM games capture authUser once at setup, so a
          // login/logout must remount the game or scores would be submitted
          // under the previous player's identity.
          <Game key={user?.id ?? "signed-out"} authUser={user} />
        ) : (
          <p className="missing-game">Game not found.</p>
        )}
      </section>
    </main>
  );
}
