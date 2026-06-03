import BackgroundDecor from "./BackgroundDecor";
import { useAuth } from "../auth/AuthContext";
import UserBadge from "./UserBadge";

export default function HowToPlay({ onBack, onPlay }) {
  const { logout, user } = useAuth();

  return (
    <main className="how-to-play">
      <BackgroundDecor />

      <header className="game-header">
        <button className="back-button" type="button" onClick={onBack}>
          <span className="back-arrow" aria-hidden="true">&larr;</span>
          Back
        </button>
        <div className="header-titles">
          <p className="eyebrow">Guide</p>
          <h1>How to play</h1>
        </div>
        <UserBadge user={user} onLogout={logout} />
      </header>

      <div className="htp-body">

        <section className="htp-section">
          <p className="htp-section-label">The 3 steps</p>
          <div className="htp-steps">

            <div className="htp-step-card">
              <div className="htp-art htp-art-drag" aria-hidden="true">
                <span className="htp-cloud htp-cloud-lift">the dark forest</span>
                <span className="htp-cloud">alone</span>
              </div>
              <span className="htp-num-badge" style={{ background: "var(--ocean)" }}>1</span>
              <h2>Drag the clouds</h2>
              <p>Pick up any word cloud and drag it into one of the numbered slots.</p>
            </div>

            <div className="htp-step-card">
              <div className="htp-art htp-art-order" aria-hidden="true">
                <span className="htp-slot htp-slot-filled">The prince</span>
                <span className="htp-slot htp-slot-filled">walked</span>
                <span className="htp-slot">3</span>
                <span className="htp-slot">4</span>
              </div>
              <span className="htp-num-badge" style={{ background: "var(--grape)" }}>2</span>
              <h2>Order the sentence</h2>
              <p>Arrange all four clouds so they rebuild the original sentence in order.</p>
            </div>

            <div className="htp-step-card">
              <div className="htp-art htp-art-check" aria-hidden="true">
                <span className="htp-check-btn">Check ✓</span>
                <span className="htp-score-pop">+100</span>
              </div>
              <span className="htp-num-badge" style={{ background: "var(--leaf)" }}>3</span>
              <h2>Check your answer</h2>
              <p>Hit Check when all slots are filled. Get it right and earn 100 points!</p>
            </div>

          </div>
        </section>

        <section className="htp-section">
          <p className="htp-section-label">Good to know</p>
          <div className="htp-tips">

            <div className="htp-tip">
              <span className="htp-tip-icon" style={{ background: "#fff1c2" }}>⚡</span>
              <div>
                <strong>3 attempts per round</strong>
                <p>You get three tries before the round resets. Each wrong guess costs one.</p>
              </div>
            </div>

            <div className="htp-tip">
              <span className="htp-tip-icon" style={{ background: "#d3f1e0" }}>↺</span>
              <div>
                <strong>Reset any time</strong>
                <p>The Reset button clears your slots so you can start the round fresh.</p>
              </div>
            </div>

            <div className="htp-tip">
              <span className="htp-tip-icon" style={{ background: "#e4dcff" }}>✦</span>
              <div>
                <strong>Stars stack up</strong>
                <p>Score points every round — your total stars show in the top bar.</p>
              </div>
            </div>

            <div className="htp-tip">
              <span className="htp-tip-icon" style={{ background: "#cfeeff" }}>→</span>
              <div>
                <strong>Multiple rounds</strong>
                <p>Each game has several sentences. Finish them all to complete the quest.</p>
              </div>
            </div>

          </div>
        </section>

        <div className="htp-footer">
          <button className="btn-primary" type="button" onClick={onPlay}>
            Play now
            <span className="btn-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </div>

      </div>
    </main>
  );
}
