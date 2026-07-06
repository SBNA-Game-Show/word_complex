# Client — Word Complex Frontend

React + Vite frontend. Handles the landing page, authentication flow, and all games rendered via ZimJS canvas.

## Stack

- **React 19** — UI layer (auth flow, launcher, screens)
- **Vite** — build tool and dev server
- **ZimJS** — canvas engine for game rendering and animations

## Structure

```
src/
├── auth/           # Auth context and fake demo client
├── components/     # Shared UI components (launcher, login, video background, etc.)
├── games/          # Game implementations (ZimJS canvas)
│   ├── PassageReconstruction/ # index.jsx — component + meta
│   ├── ContextClozeQuest/  # index.jsx — component + meta
│   ├── WordMatch/          # index.jsx — add yours here
│   ├── WordHunt/           # index.jsx — add yours here
│   ├── index.js            # Registry — single source of truth
│   └── README.md           # Step-by-step guide for adding a game
├── services/       # API calls to the backend
├── App.jsx         # Root component and screen router
└── main.jsx        # Entry point
```

## Running Locally

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`

## Adding a New Game

See [`src/games/README.md`](src/games/README.md) for the full step-by-step guide.

Short version:
1. Create `src/games/YourGame/index.jsx` with a `meta` export and default component
2. Register it in `src/games/index.js` — the launcher updates automatically, no other files needed

## Notes

- Auth is currently a fake in-memory client (`src/auth/fakeAuthClient.js`) — real auth is not yet wired up
- `src/services/api.js` handles communication with the backend server
