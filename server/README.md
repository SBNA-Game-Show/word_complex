# Server — Word Complex Backend

Node.js + Express REST API. Serves game data from MongoDB and exposes endpoints consumed by the client.

## Stack

- **Node.js + Express 5** — REST API
- **MongoDB + Mongoose** — database and ODM
- **Jest + Supertest** — testing
- **Docker** — containerized with the database via docker-compose

## Structure

```
server/
├── config/                  # DB config, env config, test DB config
├── fillinblanks/            # Fill-in-the-blanks game endpoints
├── matchwords/              # Match words game endpoints
├── passagereconstruction/   # Passage reconstruction game endpoints
├── wordhunt/                # Word hunt game endpoints
├── raw-data-connect/        # Direct data retrieval from MongoDB (tokenized stories)
├── middleware/              # Shared middleware (error handling, etc.)
├── views/                   # HTML error pages (404, etc.)
├── app.js                   # Express app setup and route registration
└── server.js                # Entry point — starts the HTTP server
```

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/fillInBlanks` | Fill in the blanks game data |
| GET | `/api/v1/matchWords` | Match words game data |
| GET | `/api/v1/passageReconstruct` | Passage reconstruction data |
| GET | `/api/v1/wordHunt` | Word hunt game data |

## Running Locally

```bash
npm install
npm run dev      # nodemon with hot reload
npm start        # production
npm test         # Jest test suite
```

Runs at `http://localhost:3000`

## Running with Docker

```bash
docker-compose up
```

## Notes

- Uses `MongoMemoryServer` for isolated in-memory testing (no real DB needed for tests)
- Environment variables managed via `.env` and `config/envconfig.js`
- Auth system has been removed — not yet re-implemented
