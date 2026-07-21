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

## Admin access

The admin surface (`/admin`, `/tokenized-editor`) is restricted to admin users.
Admin status is a boolean in Cloud Firestore at `users/{uid}/private/account.isAdmin`
(set it from the Firebase console). Access is enforced on two layers:

- **Client** — the `RequireAdmin` gate (`client/src/components/RequireAdmin.jsx`)
  reads `isAdmin` from Firestore and shows a "not authorized" screen otherwise.
- **Server** — `middleware/requireAdmin.js` verifies the caller's Firebase ID
  token and re-checks `isAdmin` in Firestore on `/api/v1/admin/*` and the tokenized
  story write endpoint. The client attaches the token via a fetch interceptor.

Setup: set `FIREBASE_SERVICE_ACCOUNT_JSON` on the server (see `server/.env.example`),
and designate admins by setting `isAdmin: true` on their `users/{uid}/private/account`
doc in the Firestore console.

Firestore security rules are managed centrally in the Firebase console (the project
is shared across several apps). The relevant `users/{userId}/private/**` rules already
let an owner read their own `isAdmin` while blocking clients from ever writing it —
only an admin (or the Admin SDK) can grant admin — so a user cannot self-promote.

**Full guide (how it works + how to make someone an admin):** [docs/admin-access.md](docs/admin-access.md)

## Guides

- [Admin access](docs/admin-access.md) - how the admin gate works and how to make someone an admin
- [Adding characters](docs/adding-characters.md) - how to add a new reading buddy (it's easy)
- [Scenes and in-game characters](docs/scenes-and-game-characters.md) - how a game gets an environment + reacting buddy
- [Art, preload, and loading](docs/art-preload-and-loading.md) - compressing/preloading art and the loading splash
- [ZIM canvas lifecycle](docs/zim-canvas-lifecycle.md) - canvas zoom controls and clean game teardown
- [Authentication](docs/authentication.md) - Firebase / Google sign-in and how to maintain it
- [Hint system](docs/hint-system-guide.md)
- [Testing & CI](docs/TESTING_AND_CI.md)

## Games

### Meaning Bridge
- Canvas game built with ZimJS
- Fetches a random Sanskrit story from MongoDB Atlas
- **Word Match mode**: match inflected Sanskrit words to their root (lemma) forms
- **Sentence Match mode**: match Sanskrit sentences to their English translations
- API routes under `/api/v1/meaningBridge/`

### Word Hunt
- Finds nouns, verbs, adjectives in English tokenized stories
- API routes under `/api/v1/wordHunt/`

## MongoDB

- **Atlas URI**: configured in `server/.env` as `ATLAS_URI`
- **Database**: `word_complex`
- **Collections**:
  - `tokenized_stories` — story data. Each document contains: `title`, `category`, `englishVersion`, `sanskritVersion`, `transliteratedVersion`, `tokenized_sanskrit_version`, `tokenized_english_version`, `storyMoral`, `actors`
  - `meaning-bridge` — Meaning Bridge best scores, one doc per player (`_id` = Firebase UID): `displayName`, `bestScore`, `bestTime` (ms), `accuracy`, `attemptsPlayed`
  - `players` — shared cross-game leaderboard (written only via `submitLeaderboardScore`)
- **IP Whitelist**: MongoDB Atlas restricts by IP — ensure your network IP is whitelisted

## Testing

```bash
cd server
npm test
```

- Uses **Jest** only (no Playwright — that was only in the ignored `trialnextjs` folder)
- Uses **MongoMemoryServer** for isolated in-memory DB during tests
- Test files: `*.test.js` in each module folder

## Docs

- Branching rules and git workflow: [`docs/Git-Repo-Rules-and-Commands.md`](docs/Git-Repo-Rules-and-Commands.md)
- Architecture overview: [`docs/simple-game-architecture.svg`](docs/simple-game-architecture.svg)
- Full architecture: [`docs/complex-game-architecture.svg`](docs/complex-game-architecture.svg)
- Standardization rules: [`docs/V2-Zatam standardization rules.docx`](docs/V2-Zatam%20standardization%20rules.docx)
- Feature specs: [`documentation/`](documentation/)

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before making any changes.

<!---comment here--->
