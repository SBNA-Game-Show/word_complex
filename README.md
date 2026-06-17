# Word Complex

An educational word game platform built with React + ZimJS (frontend) and Node.js + Express + MongoDB (backend).

## Project Structure

```
word_complex/
├── client/           # React + Vite frontend (landing page + games)
├── server/           # Node.js + Express REST API
├── docs/             # Architecture diagrams, git rules, standardization docs
├── documentation/    # Feature specs and planning JSONs
├── trialnextjs/      # Ignore for now — TBD if removing
├── docker-compose.yml
└── CONTRIBUTING.md   # Start here — branching rules and standards
```

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

## Docs

- Branching rules and git workflow: [`docs/Git-Repo-Rules-and-Commands.md`](docs/Git-Repo-Rules-and-Commands.md)
- Architecture overview: [`docs/simple-game-architecture.svg`](docs/simple-game-architecture.svg)
- Full architecture: [`docs/complex-game-architecture.svg`](docs/complex-game-architecture.svg)
- Standardization rules: [`docs/V2-Zatam standardization rules.docx`](docs/V2-Zatam%20standardization%20rules.docx)
- Feature specs: [`documentation/`](documentation/)

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before making any changes.
