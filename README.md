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
- Test files: `*.test.js` in each module folder

## Docs

- Branching rules and git workflow: [`docs/Git-Repo-Rules-and-Commands.md`](docs/Git-Repo-Rules-and-Commands.md)
- Architecture overview: [`docs/simple-game-architecture.svg`](docs/simple-game-architecture.svg)
- Full architecture: [`docs/complex-game-architecture.svg`](docs/complex-game-architecture.svg)
- Standardization rules: [`docs/V2-Zatam standardization rules.docx`](docs/V2-Zatam%20standardization%20rules.docx)
- Feature specs: [`documentation/`](documentation/)

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before making any changes.

<!---comment here--->
