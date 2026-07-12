import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchLeaderboard, fetchPlayerRank } from "./leaderboardService";
import "./LeaderboardPage.css";

/**
 * LeaderboardPage
 * --------------------------------------------------------------------------
 * The standalone leaderboard screen. A layered wizard-tower scene (background
 * and wizard mascot are SEPARATE layers so the wizard can idle-animate on its
 * own) with a segmented switcher for the Master board + the 4 game boards,
 * a top-3 podium, the ranked list, and a pinned "you" row.
 *
 * Reads only — all data comes from the leaderboard read API.
 * --------------------------------------------------------------------------
 */

// Board tabs: "master" first, then the 4 games. `key` must match the server's
// game keys exactly; `label` is the friendly display name.
const BOARDS = [
  { key: "master", label: "Master" },
  { key: "WordHunt", label: "Word Hunt" },
  { key: "PassageReconstruction", label: "Passage Reconstruction" },
  { key: "ContextQuiz", label: "Context Quiz" },
  { key: "MeaningBridge", label: "Meaning Bridge" },
];

const PODIUM_TIERS = ["gold", "silver", "bronze"]; // ranks 1,2,3
// Visual order on the podium: silver (left), gold (center, tallest), bronze (right).
const PODIUM_LAYOUT = [1, 0, 2];

/** Initials from a display name, falling back to a player tag. */
function initials(name, uuid) {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  }
  return uuid ? uuid.slice(0, 2).toUpperCase() : "??";
}

/** A score rounded for display (master totals can be fractional). */
const formatScore = (n) => Math.round(Number(n) || 0).toLocaleString();

/** ms -> compact time like "12.4s" or "1:05.2" (per-game tiebreaker stat). */
function formatTime(ms) {
  if (ms == null) return null;
  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(1)}s`;
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

/** Avatar bubble — character icon if the player has one equipped, else initials. */
function Avatar({ row, className = "" }) {
  const tag = initials(row.displayName, row.uuid);
  if (row.avatar) {
    return (
      <span className={`lb-avatar ${className}`}>
        <img src={`/characters/${row.avatar}.webp`} alt="" />
      </span>
    );
  }
  return <span className={`lb-avatar lb-avatar--initials ${className}`}>{tag}</span>;
}

export default function LeaderboardPage({ onBack }) {
  const { user } = useAuth();
  const [board, setBoard] = useState("master");
  const [rows, setRows] = useState([]);
  const [you, setYou] = useState(null); // { uuid, rank, score } | null
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const isMaster = board === "master";

  // Each load bumps a request id; only the newest result is allowed to write
  // state, so switching boards or spamming refresh can't apply a stale fetch.
  const reqRef = useRef(0);

  const loadBoard = useCallback(
    async (mode = "initial") => {
      const id = ++reqRef.current;
      if (mode === "refresh") {
        setRefreshing(true); // keep the current rows on screen while we refetch
      } else {
        setStatus("loading");
      }
      setError("");

      try {
        const [boardRows, myRank] = await Promise.all([
          fetchLeaderboard(board, 100),
          user?.id ? fetchPlayerRank(user.id, board) : Promise.resolve(null),
        ]);
        if (id !== reqRef.current) return; // superseded by a newer load
        setRows(boardRows);
        setYou(myRank);
        setStatus("ready");
      } catch (err) {
        if (id !== reqRef.current) return;
        setError(err.message || "Something went wrong");
        setStatus("error");
      } finally {
        if (id === reqRef.current) setRefreshing(false);
      }
    },
    [board, user?.id],
  );

  // Initial load + reload whenever the board or signed-in user changes.
  useEffect(() => {
    loadBoard("initial");
  }, [loadBoard]);

  const podium = useMemo(() => rows.slice(0, 3), [rows]);
  const listRows = useMemo(() => rows.slice(3), [rows]);

  // Is the signed-in player already visible in the top list? If so we don't
  // need to pin a duplicate "you" row at the bottom.
  const youInList = user?.id && rows.some((r) => r.uuid === user.id);

  return (
    <main className="lb-page" data-testid="leaderboard-page">
      {/* Layer 1 + 2: background scene and the wizard mascot (separate so the
          wizard animates independently of the static sky). */}
      <div className="lb-scene" aria-hidden="true">
        <img className="lb-scene-bg" src="/leaderboard/tower-bg.png" alt="" />
        <img className="lb-wizard" src="/leaderboard/wizard.png" alt="" />
      </div>

      <div className="lb-content">
        <header className="lb-header">
          <button className="lb-back" type="button" onClick={onBack}>
            <span aria-hidden="true">&larr;</span> Back
          </button>
          <div className="lb-titles">
            <h1>Leaderboards</h1>
            <p>Switch between games or chase the Master crown.</p>
          </div>
        </header>

        {/* Segmented board switcher */}
        <nav className="lb-switcher" aria-label="Choose a leaderboard">
          {BOARDS.map((b) => (
            <button
              key={b.key}
              type="button"
              className={`lb-tab${board === b.key ? " is-active" : ""}${
                b.key === "master" ? " lb-tab--master" : ""
              }`}
              aria-pressed={board === b.key}
              onClick={() => setBoard(b.key)}
            >
              {b.key === "master" && <span className="lb-star" aria-hidden="true">★</span>}
              {b.label}
            </button>
          ))}
        </nav>

        <section className="lb-card">
          <div className="lb-card-head">
            <div className="lb-card-title">
              <span className="lb-trophy" aria-hidden="true">🏆</span>
              <h2>
                {BOARDS.find((b) => b.key === board)?.label} — Top Players
              </h2>
            </div>
            <button
              type="button"
              className="lb-refresh"
              onClick={() => loadBoard("refresh")}
              disabled={refreshing || status === "loading"}
              aria-label="Refresh leaderboard"
            >
              <span
                className={`lb-refresh-icon${refreshing ? " is-spinning" : ""}`}
                aria-hidden="true"
              >
                ↻
              </span>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {status === "loading" && (
            <div className="lb-state">Loading the board…</div>
          )}

          {status === "error" && (
            <div className="lb-state lb-state--error">
              Couldn’t load the leaderboard. {error}
            </div>
          )}

          {status === "ready" && rows.length === 0 && (
            <div className="lb-state">
              No scores yet — be the first to climb the tower!
            </div>
          )}

          {status === "ready" && rows.length > 0 && (
            <>
              {/* Podium: top 3, arranged silver / gold / bronze */}
              <div className="lb-podium">
                {PODIUM_LAYOUT.map((idx) => {
                  const row = podium[idx];
                  if (!row) return <div key={idx} className="lb-podium-slot is-empty" />;
                  const tier = PODIUM_TIERS[idx];
                  return (
                    <div
                      key={row.uuid}
                      className={`lb-podium-slot lb-podium-slot--${tier}`}
                    >
                      <span className="lb-podium-rank">{idx + 1}</span>
                      <Avatar row={row} className="lb-avatar--podium" />
                      <span className="lb-podium-name">
                        {row.uuid === user?.id ? "You" : row.displayName || "Player"}
                      </span>
                      <span className="lb-podium-score">{formatScore(row.score)}</span>
                      {!isMaster && row.bestTime != null && (
                        <span className="lb-podium-time">{formatTime(row.bestTime)}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Ranked list, rank 4 onward */}
              {listRows.length > 0 && (
                <div className="lb-list">
                  <div className="lb-list-head">
                    <span>Rank</span>
                    <span>Player</span>
                    <span className="lb-col-score">
                      {isMaster ? "Score" : "Score · Time"}
                    </span>
                  </div>
                  {listRows.map((row) => (
                    <div
                      key={row.uuid}
                      className={`lb-row${row.uuid === user?.id ? " is-you" : ""}`}
                    >
                      <span className="lb-rank">{row.rank}</span>
                      <span className="lb-player">
                        <Avatar row={row} />
                        <span className="lb-player-name">
                          {row.uuid === user?.id ? "You" : row.displayName || "Player"}
                        </span>
                        {row.uuid === user?.id && <span className="lb-you-tag">YOU</span>}
                      </span>
                      <span className="lb-col-score">
                        <strong>{formatScore(row.score)}</strong>
                        {!isMaster && row.bestTime != null && (
                          <em className="lb-time">{formatTime(row.bestTime)}</em>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pinned "you" row — only when the player isn't already shown above */}
              {you && !youInList && (
                <div className="lb-row lb-row--pinned is-you">
                  <span className="lb-rank">{you.rank}</span>
                  <span className="lb-player">
                    <Avatar row={{ displayName: user?.name, uuid: user?.id }} />
                    <span className="lb-player-name">You</span>
                    <span className="lb-you-tag">YOU</span>
                  </span>
                  <span className="lb-col-score">
                    <strong>{formatScore(you.score)}</strong>
                  </span>
                </div>
              )}

              {/* Signed in but no record yet */}
              {user?.id && !you && !youInList && (
                <div className="lb-state lb-state--hint">
                  Play a game to claim your spot on the board.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
