import BackgroundDecor from "./BackgroundDecor";
import { getGame } from "../games";
import { useAuth } from "../auth/AuthContext";
import UserBadge from "./UserBadge";

export default function GameScreen({ gameId, onBack }) {
  const { logout, user } = useAuth();
  const game = getGame(gameId);
  const Game = game?.Component;

  return (
    <main className="game-screen">
      <BackgroundDecor />
      <header className="game-header">
        <button className="back-button" type="button" onClick={onBack}>
          <span className="back-arrow" aria-hidden="true">&larr;</span>
          Back
        </button>
        <div className="header-titles">
          <p className="eyebrow">Now playing</p>
          <h1>{game?.title ?? "Game"}</h1>
        </div>
        <div className="game-header-meta" aria-hidden="true">
          <span><span className="step-num">1</span> Drag</span>
          <span><span className="step-num">2</span> Order</span>
          <span><span className="step-num">3</span> Check</span>
        </div>
        <UserBadge user={user} onLogout={logout} />
      </header>
      <section className="canvas-shell">
        {Game ? <Game /> : <p className="missing-game">Game not found.</p>}
      </section>
    </main>
  );
}
