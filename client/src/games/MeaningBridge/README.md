# Meaning Bridge Frontend Integration

**Project:** Word Complex  
**Game:** Meaning Bridge  
**Game ID:** `meaning-bridge`  
**Client framework:** React + Vite  
**Game rendering:** ZIMJS canvas  
**Recommended location:** `client/src/games/MeaningBridge/README.md`

---

## 1. Purpose

Meaning Bridge is Game 02 in the Word Complex platform. It asks players to connect a source word card to its matching meaning card. Supported challenge modes include:

- English → Sanskrit
- Sanskrit → English
- Word → Definition
- Word → Synonym
- Word → Antonym

This frontend version was migrated from the standalone Meaning Bridge POC into Bhoj's Word Complex project. The migrated version is no longer a Next.js App Router project. It now runs inside the existing Vite + React game platform and communicates with the Express backend through the shared API service.

---

## 2. Where this frontend code lives

Place this README here:

```text
client/src/games/MeaningBridge/README.md
```

Primary frontend files:

```text
client/src/games/MeaningBridge/index.jsx
client/src/games/index.js
client/src/services/api.js
client/src/components/GameScreen.jsx
client/src/App.css
```

### File responsibilities

| File | Responsibility |
| --- | --- |
| `client/src/games/MeaningBridge/index.jsx` | Main Meaning Bridge ZIMJS game screen, menu, gameplay, result overlay, and local game state |
| `client/src/games/index.js` | Registers Meaning Bridge as playable Game 02 in the launcher |
| `client/src/services/api.js` | Provides frontend functions for generate, submit, and leaderboard API calls |
| `client/src/components/GameScreen.jsx` | Shared game wrapper; includes Meaning Bridge-specific canvas zoom controls |
| `client/src/App.css` | Shared app styling plus scoped Meaning Bridge canvas containment styles |

---

## 3. Architecture overview

The player-facing Meaning Bridge experience is rendered inside a ZIMJS canvas. React is used as the platform shell only.

```text
React/Vite shell
  └── GameScreen.jsx
        └── MeaningBridge/index.jsx
              └── createZimGame(...)
                    └── ZIMJS canvas menu/gameplay/result UI
```

React handles:

- game routing/launcher integration
- page header/back/logout/user badge
- canvas wrapper sizing
- API helper imports
- optional zoom controls

ZIMJS handles:

- menu screen
- player name editing
- mode/difficulty/pair selection
- word cards and meaning cards
- click-to-match interactions
- bridge drawing
- hints/reset/submit/new round controls
- result overlay
- leaderboard preview

---

## 4. Game registration

Meaning Bridge is registered through:

```text
client/src/games/index.js
```

Expected registry entry:

```js
import MeaningBridge, { meta as meaningBridgeMeta } from "./MeaningBridge";

export const games = [
  { ...sentenceBuilderMeta, Component: SentenceBuilder },
  { ...meaningBridgeMeta, Component: MeaningBridge },
  { ...contextClozeQuestMeta, Component: ContextClozeQuest },
  // ...
];
```

Meaning Bridge should export metadata from:

```text
client/src/games/MeaningBridge/index.jsx
```

Example:

```js
export const meta = {
  id: "meaning-bridge",
  cardNumber: "02",
  cardArt: "art-sea",
  title: "Meaning Bridge",
  description: "Connect words to Sanskrit, meanings, synonyms, and antonyms.",
};
```

---

## 5. API usage from the frontend

Frontend API helpers live in:

```text
client/src/services/api.js
```

Meaning Bridge uses:

```js
generateMeaningBridgeRound(options)
submitMeaningBridgeRound(payload)
getMeaningBridgeLeaderboard(limit)
```

Expected backend base URL:

```js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
```

Meaning Bridge API endpoints:

```text
POST /api/v1/meaningBridge/generate
POST /api/v1/meaningBridge/submit
GET  /api/v1/meaningBridge/leaderboard?limit=5
```

---

## 6. Running locally

Use two terminals.

### Terminal A — Backend

```powershell
cd C:\Users\Nawaf\Desktop\word_complex\server
npm start
```

Expected backend:

```text
Backend listening on port 5000
```

### Terminal B — Frontend

```powershell
cd C:\Users\Nawaf\Desktop\word_complex\client
npm run dev
```

Open:

```text
http://localhost:5173/
```

---

## 7. Build check

From the client folder:

```powershell
cd C:\Users\Nawaf\Desktop\word_complex\client
npm run build
```

Expected:

```text
✓ built
```

The Vite bundle-size warning is acceptable for now because ZIMJS is bundled into the client. Code splitting can be considered later.

---

## 8. Important ZIMJS note

Do **not** add this back to the Meaning Bridge `createZimGame` config:

```js
scaling: "fit"
```

It caused the ZIM canvas to ignore the intended embedded layout and behave too much like a full-window canvas. The Word Complex app should contain the game through the shared `.zim-holder` and Meaning Bridge-specific CSS.

Current intended behavior:

```text
React page shell = stable
ZIM holder = stable embedded game window
ZIM canvas = renders the game experience
```

The zoom controls in `GameScreen.jsx` are meant to affect the canvas view, not the whole React application page.

---

## 9. Current gameplay flow

Meaning Bridge currently uses a simple screen-state model inside the ZIM game:

```js
let screen = "menu";
```

Screens:

```text
menu
  → choose player name
  → choose mode
  → choose difficulty
  → choose pair count
  → Start Bridge

gameplay
  → select left word card
  → select matching right card
  → use Hint / Reset / Submit / New Round / Menu

result overlay
  → score
  → accuracy
  → round point earned/not earned
  → mini leaderboard
  → Menu / Next Round
```

---

## 10. Layout editing guide

Most layout changes should be made through constants near the top of:

```text
client/src/games/MeaningBridge/index.jsx
```

Main layout objects:

```js
GAMEPLAY_LAYOUT
MENU_LAYOUT
```

Use these constants before hardcoding new coordinates. This keeps the file maintainable for the team.

Common functions:

| Function | Purpose |
| --- | --- |
| `drawMenuScene()` | Draws the ZIMJS start/menu screen |
| `drawMenuPlayerNamePanel()` | Draws/edit player name panel |
| `drawHeader()` | Draws gameplay title/progress/status |
| `drawPassagePanel()` | Draws passage title and text |
| `drawCards()` | Draws left/right card panels |
| `drawCard()` | Draws individual card visual states |
| `drawConnections()` | Draws matched-card connection lines |
| `drawRoundSummary()` | Draws player/progress summary |
| `drawFeedbackPanel()` | Draws hint/error/success feedback |
| `drawControls()` | Draws gameplay buttons |
| `drawResultPanel()` | Draws end-of-round overlay |
| `drawLeaderboard()` | Draws in-game leaderboard row |

---

## 11. Manual QA checklist

Before considering the frontend stable, check:

```text
[ ] Meaning Bridge appears as Game 02 in the launcher.
[ ] Game opens to the ZIMJS menu screen.
[ ] Player name panel can be edited.
[ ] Empty player name falls back to Guest Player.
[ ] Mode buttons update the selected mode.
[ ] Difficulty buttons update selected difficulty.
[ ] Pair count buttons update selected pair count.
[ ] Start Bridge calls backend generate route.
[ ] Word cards and meaning cards appear.
[ ] Correct match creates a connection line.
[ ] Wrong match increments wrong attempts.
[ ] Hint works after selecting a word card.
[ ] Reset clears current round state.
[ ] Submit returns a result overlay.
[ ] Leaderboard updates after submit.
[ ] Menu button returns to menu screen.
[ ] New Round / Next Round generates another backend round.
[ ] Client build passes with `npm run build`.
```

---

## 12. Known follow-up work

- Further polish menu spacing and card layout.
- Improve canvas-only zoom behavior if click alignment ever becomes unreliable.
- Consider code-splitting ZIMJS to reduce the main Vite bundle size.
- Add frontend automated smoke tests after layout stabilizes.
- Replace fallback frontend demo text with final product wording before submission/demo.
