import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { games } from "../games/index.js";
import {
  getLeaderboard,
  inputSources as seedSources,
  SOURCE_TYPES,
  tokenizedStories as seedStories,
  DIFFICULTIES,
} from "./adminData";
import "./admin.css";

// ── Admin panel (WIREFRAME) ────────────────────────────────────────────────
// UI only. No backend, no real persistence — local state just makes toggles
// feel alive for the demo. All admin logic is contained in this folder so it
// can be lifted into a routed /admin page later without touching the panel.
//
// Sections map to the brief:
//   Leaderboards     -> per-game scores
//   Games            -> up to 4 games, enable/disable + swap (preconfigured)
//   Input Sources    -> up to 5 sources, enable/disable + swap (offline)
//   Tokenized Stories-> stories from DB via preprocessor; push to game collection

const SECTIONS = [
  { id: "leaderboards", label: "Leaderboards" },
  { id: "games", label: "Games" },
  { id: "sources", label: "Input Sources" },
  { id: "stories", label: "Tokenized Stories" },
];

const SECTION_META = {
  leaderboards: { title: "Leaderboards", subtitle: "Top scores per game." },
  games: { title: "Games", subtitle: "Up to 4 games. Enable, disable, or swap." },
  sources: { title: "Input Sources", subtitle: "Up to 5 sources. Configured offline by the admin." },
  stories: { title: "Tokenized Stories", subtitle: "Stories read from the DB. Push a story into the game collection." },
};

export default function AdminPanel({ onExit }) {
  const { user, logout } = useAuth();
  const [section, setSection] = useState("leaderboards");
  const meta = SECTION_META[section];

  return (
    <div className="adm-root">
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <span className="adm-brand-badge">W</span>
          <div>
            <strong>Word Complex</strong>
            <span className="adm-brand-sub">Admin</span>
          </div>
        </div>

        <nav className="adm-nav" aria-label="Admin sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`adm-nav-item${section === s.id ? " is-active" : ""}`}
              onClick={() => setSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          <button type="button" className="adm-btn adm-btn-ghost" onClick={onExit}>
            &larr; Back to games
          </button>
          <button type="button" className="adm-btn adm-btn-quiet" onClick={logout}>
            Log out{user?.name ? ` (${user.name})` : ""}
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <header className="adm-header">
          <div>
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
          </div>
          <span className="adm-wire-tag">Wireframe · mock data</span>
        </header>

        <section className="adm-content">
          {section === "leaderboards" && <Leaderboards />}
          {section === "games" && <Games />}
          {section === "sources" && <InputSources />}
          {section === "stories" && <TokenizedStories />}
        </section>
      </main>
    </div>
  );
}

// ── Leaderboards: game list (left) + score table (right) ────────────────────
function Leaderboards() {
  const [activeId, setActiveId] = useState(games[0]?.id);
  const activeGame = games.find((g) => g.id === activeId) ?? games[0];
  const seed = Math.max(0, games.findIndex((g) => g.id === activeId));
  const rows = getLeaderboard(seed);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="adm-leaderboard">
      <ul className="adm-gamelist">
        {games.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              className={`adm-gamelist-item${g.id === activeId ? " is-active" : ""}`}
              onClick={() => setActiveId(g.id)}
            >
              {g.title}
            </button>
          </li>
        ))}
      </ul>

      <div className="adm-board">
        <h2 className="adm-board-title">{activeGame?.title}</h2>
        <table className="adm-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank}>
                <td className="adm-rank">{medals[r.rank - 1] ?? r.rank}</td>
                <td>{r.player}</td>
                <td>{r.score}</td>
                <td className="adm-muted">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Games: up to 4 slots, enable/disable + swap + difficulty ────────────────
function Games() {
  const [config, setConfig] = useState(() =>
    games.map((g) => ({ id: g.id, title: g.title, enabled: true, difficulty: "Medium" }))
  );

  function update(id, patch) {
    setConfig((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  return (
    <div className="adm-cards">
      {config.map((c, i) => (
        <article key={c.id} className={`adm-card${c.enabled ? "" : " is-off"}`}>
          <div className="adm-card-head">
            <span className="adm-slot">Slot {i + 1}</span>
            <label className="adm-switch">
              <input
                type="checkbox"
                checked={c.enabled}
                onChange={(e) => update(c.id, { enabled: e.target.checked })}
              />
              <span>{c.enabled ? "Enabled" : "Disabled"}</span>
            </label>
          </div>

          <h3 className="adm-card-title">{c.title}</h3>

          <div className="adm-field">
            <span>Game</span>
            <select
              value={c.title}
              onChange={(e) => update(c.id, { title: e.target.value })}
            >
              {games.map((g) => (
                <option key={g.id} value={g.title}>{g.title}</option>
              ))}
              <option value="">— Empty slot —</option>
            </select>
          </div>

          <div className="adm-field">
            <span>Difficulty</span>
            <select
              value={c.difficulty}
              onChange={(e) => update(c.id, { difficulty: e.target.value })}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </article>
      ))}
    </div>
  );
}

// ── Input Sources: up to 5 slots, enable/disable + swap ─────────────────────
function InputSources() {
  const [sources, setSources] = useState(seedSources);

  function update(id, patch) {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  return (
    <div className="adm-cards">
      {sources.map((s, i) => (
        <article
          key={s.id}
          className={`adm-card${s.status === "disabled" ? " is-off" : ""}${
            s.status === "empty" ? " is-empty" : ""
          }`}
        >
          <div className="adm-card-head">
            <span className="adm-slot">Source {i + 1}</span>
            {s.status !== "empty" && (
              <label className="adm-switch">
                <input
                  type="checkbox"
                  checked={s.status === "active"}
                  onChange={(e) => update(s.id, { status: e.target.checked ? "active" : "disabled" })}
                />
                <span>{s.status === "active" ? "Active" : "Disabled"}</span>
              </label>
            )}
          </div>

          {s.status === "empty" ? (
            <button type="button" className="adm-add-slot">+ Add input source</button>
          ) : (
            <>
              <h3 className="adm-card-title">{s.name}</h3>
              <div className="adm-field">
                <span>Type</span>
                <select
                  value={s.type}
                  onChange={(e) => update(s.id, { type: e.target.value })}
                >
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="adm-btn adm-btn-ghost adm-btn-block">
                Swap source
              </button>
            </>
          )}
        </article>
      ))}
    </div>
  );
}

// ── Tokenized Stories: DB view + pull from web + push to game collection ────
function TokenizedStories() {
  const [stories, setStories] = useState(seedStories);

  function toggleCollection(id) {
    setStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, inCollection: !s.inCollection } : s))
    );
  }

  return (
    <div className="adm-stories">
      <div className="adm-toolbar">
        <button type="button" className="adm-btn adm-btn-primary">
          ↓ Pull new story from web
        </button>
        <span className="adm-muted">{stories.length} stories in DB</span>
      </div>

      <table className="adm-table adm-table-wide">
        <thead>
          <tr>
            <th>Story</th>
            <th>Source</th>
            <th>Tokens</th>
            <th>In collection</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {stories.map((s) => (
            <tr key={s.id}>
              <td>{s.title}</td>
              <td className="adm-muted">{s.source}</td>
              <td>{s.tokens}</td>
              <td>
                <span className={`adm-chip${s.inCollection ? " is-on" : ""}`}>
                  {s.inCollection ? "Added" : "Not added"}
                </span>
              </td>
              <td className="adm-cell-action">
                <button
                  type="button"
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  onClick={() => toggleCollection(s.id)}
                >
                  {s.inCollection ? "Remove" : "Add to collection"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
