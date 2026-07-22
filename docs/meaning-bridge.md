# Meaning Bridge

## Overview

Meaning Bridge is the vocabulary-matching game in Word Complex (card **02** on the
main menu, game id `meaning-bridge`). Players connect words on the left to their
**synonyms, antonyms, or definitions** on the right. It is a ZIM canvas game wrapped
in the React scene shell, so it gets a painted background and a reading buddy who
cheers and speaks hints.

There are three challenge types — Synonym Bridge, Definition Bridge, and Opposite
Bridge — and two ways to play each:

- **Practice** — no countdown. Finish a puzzle, see your stats (points, accuracy,
  time, hints, misses), then continue or see final results.
- **Timed Challenge** — solve as many puzzles as possible before the timer expires.
  Presets: 2:00, 5:00, 10:00, or custom (clamped to 1–60 minutes).

For a visual of how everything connects, see
[meaning-bridge-architecture.svg](meaning-bridge-architecture.svg).

## Where the code lives

**Frontend (one file):**

| File | Job |
|------|-----|
| `client/src/games/MeaningBridge/index.jsx` | The entire game — menus, canvas gameplay, timers, round-complete and final-score screens, exit confirmation. Talks to the server through `client/src/services/meaningBridgeApi.js`. |

**Backend (`server/meaning-bridge/`):**

| File | Job |
|------|-----|
| `routes/meaningbridgeroutes.js` | Defines the endpoints, mounted at `/api/v1/meaningBridge` in `server/app.js`. |
| `controller/meaningbridgecontroller.js` | Receives requests and calls the services. |
| `service/generatepuzzle.js` | Builds the word pairs for a round from the selected story's tokenized data. |

(Scoring/best-score logic sits next to these in `service/meaningBridgeScoreService.js`,
saving one best-score document per player in the `meaning-bridge` Mongo collection.)

## Running the project

You need two terminals — one for the backend, one for the frontend.

**Backend:**

```bash
cd server
npm install
npm run dev        # starts the API on http://localhost:5000
```

**Frontend:**

```bash
cd client
npm install
npm run dev        # starts Vite, usually http://localhost:5173
```

Open the Vite URL in the browser. The client expects the API at
`http://localhost:5000/api/v1` (override with `VITE_API_URL` in `client/.env`).

## Navigating to the game

1. Sign in (Google, email, or Guest) on the login screen.
2. From the **main menu**, open the game cards and pick **Meaning Bridge** (card 02).
3. Choose a challenge type: **Synonym**, **Definition**, or **Opposite** Bridge.
4. Choose **Practice** or **Timed Challenge** (and a timer length if timed).
5. Play: click a word on the left, then its match on the right. The buddy reacts;
   press **Hint** to have the buddy speak a clue.
6. When a puzzle is done, the round-complete screen shows your stats — continue to
   the next puzzle or **See Results** to submit your score and open the leaderboard.
7. **Exit** (or Escape) always asks for confirmation first — "Keep Playing" or
   "Exit to Menu" — so progress is never lost by accident.
