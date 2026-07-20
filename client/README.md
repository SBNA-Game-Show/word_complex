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

See also: [`../docs/zim-canvas-lifecycle.md`](../docs/zim-canvas-lifecycle.md) (build a ZIM
game with clean teardown + zoom) and [`../docs/scenes-and-game-characters.md`](../docs/scenes-and-game-characters.md)
(give the game an environment and a reacting character).

## Adding a Character

See [`../docs/adding-characters.md`](../docs/adding-characters.md). Short version: drop a
`.webp` in `public/characters/<id>.webp`, add an entry to `CHARACTERS` in
`src/components/CharacterSelect.jsx`, and set how it's earned in the server's
`progress/progressConfig.js`.

## Notes

- Auth is Firebase (Google, email/password, and guest). See [`../docs/authentication.md`](../docs/authentication.md) for how it works and how to maintain it.
- `src/services/api.js` handles communication with the backend server
- Admin routes (`/admin`, `/tokenized-editor`) are gated by `RequireAdmin`
  (`src/components/RequireAdmin.jsx`), which reads `isAdmin` from Firestore
  (`users/{uid}/private/account.isAdmin`) via `src/auth/adminClient.js`. The
  admin's Firebase token is attached to admin API calls by the fetch interceptor
  in `src/auth/adminAuthInterceptor.js` (installed in `main.jsx`). See
  [`../docs/admin-access.md`](../docs/admin-access.md) for the full guide.
