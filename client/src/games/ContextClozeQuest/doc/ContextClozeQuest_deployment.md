# Context Cloze Quest: Setup and Deployment

> Last verified: 2026-07-21. This document covers the game's requirements; repository-wide deployment policy remains authoritative.

## Prerequisites

- A supported Node.js/npm installation.
- Access to the project's MongoDB Atlas database or an appropriate local/test database configuration.
- A story document containing the language and token fields required by the game.
- For authenticated score submission, the application's Firebase setup.

## Run locally

Open two terminals from the repository root.

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd client
npm install
npm run dev
```

Defaults:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API base: `http://localhost:5000/api/v1`

Select a story in the application, launch Context Cloze Quest, and verify a puzzle loads for each supported language you intend to test.

## Environment variables

### Client

```dotenv
VITE_API_URL=http://localhost:5000/api/v1
```

This value must include `/api/v1` and must be available to Vite at build time. If it is omitted, the local default above is used. Other application-wide Firebase variables may also be required; follow the repository authentication documentation and example environment files.

### Server

```dotenv
ATLAS_URI=mongodb-connection-string
PORT=5000
NODE_ENV=development
```

`ATLAS_URI` is required by `server/config/dataConnectConfig.js`. Never commit a real URI or service credential. MongoDB Atlas may also require the current host IP/network to be allowed.

## Required story shape

For `language=english`, the controller reads:

- `englishVersion`
- `tokenized_english_version`

For `language=sanskrit`, it reads:

- `sanskritVersion`
- `tokenized_sanskrit_version`

Token entries should include `text` and either `pos` or `upos`, using tags such as `NOUN`, `VERB`, and `ADJ`. A story with too few eligible unique words produces fewer blanks rather than a server error.

## Pre-release verification

Run the relevant checks from each package:

```bash
cd client
npm test
npm run build
```

```bash
cd server
npm test
```

Then perform a full-stack smoke test:

1. Load English and Sanskrit puzzles.
2. Test easy, medium, and hard.
3. Select each word type and a multi-type combination.
4. Drag, replace, and return word buttons.
5. Use zero, one, and two hints.
6. Submit correct, incorrect, incomplete, and timed-out rounds.
7. Confirm a signed-in non-guest score appears through the leaderboard endpoint.
8. Confirm guest play does not create a score.

## Production configuration

- Set `VITE_API_URL` to the public backend API base before building the client.
- Set `ATLAS_URI` and platform-specific server environment variables securely.
- Ensure CORS configuration permits the deployed frontend origin.
- Ensure the selected database is `word_complex` and contains tokenized stories.
- Use the repository's normal hosting/container workflow; do not invent a game-specific server process because the route is part of the shared Express application.

## Rollback considerations

The current API has no version negotiation beyond `/api/v1`. Deploy compatible frontend and backend changes together when changing response shapes, scoring fields, POS tags, or language-field conventions. Database score documents are simple upserts, but schema changes should preserve old documents or include a migration plan.

