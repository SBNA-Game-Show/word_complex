# Word Complex

An educational Sanskrit word game platform built with React + ZimJS (frontend) and Node.js + Express + MongoDB Atlas (backend).

## Project Structure

```
word_complex/
├── client/           # React + Vite frontend (landing page + games)
├── server/           # Node.js + Express REST API
├── docs/             # Architecture diagrams, git rules, standardization docs
├── documentation/    # Feature specs and planning JSONs
└── CONTRIBUTING.md   # Start here — branching rules and standards
```

> `trialnextjs/` is NOT part of this project — ignore it.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, ZimJS (canvas games) |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas (`word_complex` db, `tokenized_stories` collection) |
| Auth | Firebase Auth (email, Google, guest) |
| Testing | Jest only (server-side unit + integration tests) |
| Test DB | MongoMemoryServer (in-memory, no real DB needed for tests) |

## Getting Started

**Frontend:**
```bash
cd client
npm install
npm run dev
```
Runs at `http://localhost:5173`

**Backend:**
```bash
cd server
npm install
npm run dev
```
Runs at `http://localhost:5000`

**Full stack with Docker:**
```bash
docker-compose up
```

### Frontend Environment

Copy `client/.env.example` to `client/.env.local` and fill in your Firebase credentials.

For local development without Firebase, use the bypass mode:
```
VITE_E2E_AUTH_BYPASS=true
```
This skips Firebase entirely and lets "Continue as guest" work with no credentials.

---

## Games

### Game Architecture — How Every Game Is Built

All games follow the **same pattern** — no exceptions. This keeps the codebase consistent and makes adding new games straightforward.

**File structure for every game:**
```
client/src/games/YourGame/
└── index.jsx          # The entire game lives here
```

**Code pattern:**
```js
import { createZimGame } from "../createZimGame";

// 1. Export the game component as the default export
export default createZimGame({
  id: "your-game-id",       // unique, matches meta.id
  width: 1100,
  height: 720,
  color: "#ffffff",         // ZimJS canvas background
  outerColor: "#151019",    // color outside the canvas

  setup({ stage, W, H, zim }) {
    // All game logic goes here using ZimJS
    // Use font "Fredoka" to match the app design
    // Use the app color palette (see App.css :root variables)
  },
});

// 2. Export meta so the launcher can show the game card
export const meta = {
  id: "your-game-id",
  cardNumber: "02",         // display number on the card
  cardArt: "art-sea",       // CSS class for the card illustration
  title: "Your Game Title",
  description: "One sentence describing what the player does.",
};
```

**To register a new game**, add it to `client/src/games/index.js`:
```js
import YourGame, { meta as yourGameMeta } from "./YourGame";

export const games = [
  ...
  { ...yourGameMeta, Component: YourGame },
];
```

That's it — the launcher card appears automatically.

**To show a game as "Coming Soon"** (no playable version yet), add the entry without `Component`:
```js
{ ...yourGameMeta }   // no Component = locked card in launcher
```

### Design Rules for Every Game

Every game canvas must feel like part of the same app:

- **Font:** `"Fredoka"` — same as the rest of the UI
- **Colors:** Use the app palette from `App.css :root`:
  - `#1d2b66` — ink (dark text)
  - `#fff7e6` — cream (warm background)
  - `#ffd84d` — sunshine (yellow)
  - `#ff9a3c` — tangerine (orange)
  - `#ff6fb5` — bubblegum (pink)
  - `#9b6bff` — grape (purple)
  - `#46c97a` — leaf (green)
  - `#2fb6d6` — ocean (blue)
- **Buttons:** Pill-shaped, same style as the launcher
- **Cards/panels:** White, rounded corners, soft shadow with 3D bottom pop
- **Feedback:** Simple and immediate — no separate screens for settings or results
- **Simplicity:** A kid should be able to start playing within 3 seconds of clicking the game card. No setup screens, no menus before play.

---

## Current Games

| # | Game | Status | Notes |
|---|------|--------|-------|
| 01 | Passage Reconstruction | ✅ Playable | Fetches real stories from MongoDB |
| 02 | Meaning Bridge | 🔨 Being rebuilt | See below |
| 03 | Context Cloze Quest | ✅ Playable | Static story (hardcoded) |
| 04 | Word Hunt | ✅ Playable | Static story (hardcoded) |

---

## Meaning Bridge — Rebuild History

### Backend API

**Base route:** `POST /api/v1/meaningBridge/generate`

**Request body:**
```json
{ "pairCount": 4, "mode": "word-to-synonym" }
```

**Supported modes (v1):**
- `word-to-synonym` — match a word to one of its synonyms
- `word-to-antonym` — match a word to its opposite
- `word-to-definition` — match a word to its definition (reads `token.definition` — singular string field on each token)

**Response shape:**
```json
{
  "success": true,
  "puzzle": {
    "roundId": "round_abc123",
    "mode": "word-to-synonym",
    "instruction": "Match each word to one of its synonyms.",
    "leftItems":  [{ "id": "left_0", "label": "departed", "sublabel": "verb" }],
    "rightItems": [{ "id": "right_0", "label": "left", "sublabel": "synonym" }],
    "answerKey":  { "left_0": "right_0" }
  },
  "passage": {
    "title": "The Rabbit and the Weasel",
    "text": "When the rabbit left his home..."
  }
}
```

**Removed from backend for v1 (simple game):**
- `POST /submit` — server-side round scoring. Removed because the simple game checks matches on the frontend. Add back when leaderboard is needed.
- `GET /leaderboard` — player rankings. Add back in v2.
- `roundstore.js`, `scorestore.js`, `scoreround.js` — all depended on submit/leaderboard. Still exist as files but are no longer used. Delete when v2 is built.
- API key middleware — removed from the generate route. Add back when the game goes to production.

**What to add for v2:**
- Server-side scoring via `/submit`
- Leaderboard via `/leaderboard`
- Per-player score tracking
- Hints system (data already exists in `puzzle.hints` from the backend)

---

### What was there (removed)

The original Meaning Bridge was a 4,910-line file that was:

- **Broken:** The file was truncated mid-line with no closing brackets and no `export default`. The game did not render at all.
- **Wrong architecture:** It used `useState`/`useEffect` from React wrapped around `createZimGame`, creating a hybrid that didn't match how any other game was built.
- **Too complex for kids:** Before a player could start the game, they had to navigate:
  - A landing screen with hotspot click zones over a background image
  - A setup screen asking them to choose: round type (Practice/Timed), timer length (2:00/5:00/10:00/custom), challenge mode (5 options), difficulty (easy/medium/hard), pair count (4/5/6), and their player name
  - Separate leaderboard screen, rules screen, sound toggle, large-text toggle, zoom controls, quit confirmation panel
- **Not unified:** Used Arial font and its own color scheme instead of the app's Fredoka font and design system. Looked like a completely different product.
- **Instructor feedback:** Ranked last in class review specifically because of this game. Feedback was that it was too messy and cluttered for the target audience (kids).

### What the rebuilt version will be

A simple word-matching game that follows the same `createZimGame` pattern as every other game:

- Player lands directly in the game — no setup screen
- Word cards on the left, meaning cards on the right — click a word, click its match
- Pair count increases quietly across rounds: Round 1 → 4 pairs, Round 2 → 5 pairs, Round 3 → 6 pairs
- The player is never shown these numbers or asked to choose — difficulty just grows naturally
- After finishing a round, player sees "Well done!" and a **Next Round** button — they only continue if they want to
- If they click Back at any point, they return to the launcher — no forced progression
- After Round 3, show a simple "You finished!" screen with a Play Again button
- Fredoka font, app color palette, same card/button style as the launcher
- Fetches word pairs from the backend (`/api/v1/meaningBridge/generate`)

> **Note:** The round structure (4→5→6 pairs, 3 rounds) is a starting point and open to change. If playtesting shows kids want fewer or more rounds, or a flat pair count works better, adjust `pairCounts` in the game file.

---

## MongoDB

- **Atlas URI**: configured in `server/.env` as `ATLAS_URI`
- **Database**: `word_complex`
- **Collection**: `tokenized_stories`
- Each story document contains: `title`, `category`, `englishVersion`, `sanskritVersion`, `transliteratedVersion`, `tokenized_sanskrit_version`, `tokenized_english_version`, `storyMoral`, `actors`
- **IP Whitelist**: MongoDB Atlas restricts by IP — ensure your network IP is whitelisted

## Testing

```bash
cd server
npm test
```

- Uses **Jest** only (no Playwright — that was only in the ignored `trialnextjs` folder)
- Uses **MongoMemoryServer** for isolated in-memory DB during tests

## Docs

- Branching rules and git workflow: [`docs/Git-Repo-Rules-and-Commands.md`](docs/Git-Repo-Rules-and-Commands.md)
- Architecture overview: [`docs/simple-game-architecture.svg`](docs/simple-game-architecture.svg)
- Full architecture: [`docs/complex-game-architecture.svg`](docs/complex-game-architecture.svg)
- Standardization rules: [`docs/V2-Zatam standardization rules.docx`](docs/V2-Zatam%20standardization%20rules.docx)
- Feature specs: [`documentation/`](documentation/)

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before making any changes.

<!---comment here--->
