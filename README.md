# Word Complex Game Platform

A configurable passage-based word puzzle platform for language learning and literary comprehension.

Word Complex turns passages from literature, stories, articles, textbooks, or other text sources into interactive word games. Users load or select a passage, the system preprocesses and chunks the text, stores the passage data, and then generates multiple puzzle games from the same content.

The approved MVP contains **4 games** with **2 team members assigned per game** for an 8-person team.

---

## Project Summary

The goal of this project is to build a reusable word-game platform, not just one fixed game. The platform should allow an admin to configure which input sources and games are enabled, while users play games generated from selected passage content.

### Core MVP Direction

- Build a **4-game passage-based puzzle platform**.
- Use a shared preprocessing and chunking pipeline.
- Store passages, chunks, scores, and leaderboard data in **MongoDB**.
- Render visually interactive games using **ZIM** inside the web application.
- Use a reusable game API structure so each game follows the same data contract.
- Support offline admin configuration through a local JSON configuration file.
- Keep the MVP realistic for the co-op term from **May 11 to July 20**.

---

## Approved MVP Games

| # | Game | Main Learning Goal | Build Style | Team Assignment |
|---|------|--------------------|-------------|-----------------|
| 1 | Context Cloze Quest | Vocabulary, context clues, reading comprehension | Fill-in-the-blank puzzle | 2 team members |
| 2 | Word Match / Translation Match | Meaning, synonyms, definitions, translation recognition | Matching pairs | 2 team members |
| 3 | Passage Reconstruction Puzzle | Sentence structure, grammar, word order | Drag-and-drop reconstruction | 2 team members |
| 4 | Word Hunt Challenge | Close reading, category recognition, vocabulary scanning | Click/select target words | 2 team members |

---

## Team Structure

The group has **8 people**, with **2 people assigned to each game**.

| Pair | Game Ownership | Main Responsibilities | Shared Integration Responsibility |
|------|----------------|-----------------------|----------------------------------|
| Pair 1 | Context Cloze Quest | Cloze puzzle generator, blanks, choices, answer validation, UI | Help define the common game payload format |
| Pair 2 | Word Match / Translation Match | Matching-pair generator, dictionary lookup, match validation, UI | Help define dictionary/translation data format |
| Pair 3 | Passage Reconstruction Puzzle | Sentence splitting, tile shuffling, reorder validation, UI | Help define reusable drag/drop or tile components |
| Pair 4 | Word Hunt Challenge | Word extraction, category/translation clues, clickable word validation, UI | Help define shared scoring rules and feedback messages |

### Important Team Rule

Each pair owns one game, but all games must use the same shared platform pipeline:

```text
Input Source
  -> Preprocessor
  -> Chunking Engine
  -> MongoDB Passage/Chunk Store
  -> Game Generator API
  -> ZIM Game Renderer
  -> Scoring Engine
  -> Leaderboard
```

No game should build a completely separate backend or data format.

---

## Tech Stack

### Frontend

- **Next.js** — main web application framework
- **React** — UI component system
- **TypeScript** — type-safe application code
- **Tailwind CSS** — styling and responsive layout
- **ZIM JavaScript Canvas Framework** — interactive game rendering, canvas visuals, drag/drop, matching, and clickable game elements

### Backend / API Layer

- **Next.js API Routes / Route Handlers** — backend endpoints for input processing, game generation, scoring, and leaderboard access
- **Node.js Runtime** — server-side execution environment
- **TypeScript** — shared types for API requests, responses, game payloads, and scoring

### Database

- **MongoDB** — primary database for the MVP
- Recommended collections:
  - `passages`
  - `chunks`
  - `dictionary_entries`
  - `game_sessions`
  - `scores`
  - `leaderboard_entries`

### RAG / Vector Store Direction

For the MVP, MongoDB will act as the main passage and chunk store. The project can start with normal indexed retrieval first. If vector search is required later, the team can extend the MongoDB layer using embeddings and vector search support.

The key MVP priority is to keep passage retrieval working reliably for all 4 games before adding advanced semantic retrieval.

### Testing

- **Vitest** — unit tests and logic tests
- **React Testing Library** — component tests
- **Playwright** — end-to-end browser testing
- **ESLint** — code quality and linting

---

## Required Features

### User Features

- Select or load a passage.
- Choose one of the approved games.
- Play a puzzle generated from the selected passage.
- Receive immediate feedback.
- Earn points based on correct answers.
- View leaderboard results.

### Admin / Configuration Features

For the MVP, admin configuration should be handled through a local JSON file instead of a full admin dashboard.

The admin should be able to configure:

- Enabled games
- Enabled input sources
- Default difficulty
- Language pair
- Number of questions per round
- Scoring values

Example configuration:

```json
{
  "enabledGames": [
    "context_cloze",
    "word_match",
    "passage_reconstruction",
    "word_hunt"
  ],
  "enabledSources": [
    "manual_text",
    "local_file",
    "api_source"
  ],
  "defaultDifficulty": "medium",
  "languagePair": "english-sanskrit",
  "maxQuestionsPerRound": 10,
  "scoring": {
    "correct": 10,
    "incorrect": 0,
    "hintPenalty": 2
  }
}
```

---

## Input Sources

The product requirement says the platform should support up to **5 input sources**. For the MVP, the architecture should support five types, but the team should fully polish the most reliable two or three first.

| Input Source | Description | MVP Priority |
|-------------|-------------|--------------|
| Manual Text Input | User pastes a passage into the platform | High |
| Local Text File Upload | User uploads a `.txt` or simple text file | High |
| API / URL Text Source | Platform reads text from a configured URL or API | Medium |
| Preloaded Literature Dataset | Admin ships selected passages with the app | Medium |
| Dictionary / Translation Dataset | Used for translation, synonym, and clue generation | Medium |

---

## Game Details

## 1. Context Cloze Quest

### Description

A fill-in-the-blank game generated from selected passage chunks.

### Example

```text
Original: Rama walked through the forest with Sita and Lakshmana.
Puzzle: Rama walked through the ______ with Sita and Lakshmana.
Choices: river, forest, palace, mountain
Correct Answer: forest
```

### Learning Purpose

- Vocabulary recall
- Reading comprehension
- Context clues
- Word recognition
- Sentence-level understanding

### Game Generation Flow

```text
Select passage chunk
  -> Identify candidate words
  -> Remove selected word
  -> Generate answer choices
  -> Render puzzle
  -> Validate answer
  -> Update score
```

---

## 2. Word Match / Translation Match

### Description

A matching game where players connect passage words to meanings, synonyms, definitions, or translations.

### Example

```text
forest -> vanam
king   -> raja
fire   -> agni
water  -> jalam
```

The game displays two shuffled columns, and the player matches the correct pairs.

### Learning Purpose

- Vocabulary association
- Translation recognition
- Memory recall
- Bilingual word learning
- Meaning relationships

### Game Generation Flow

```text
Extract important words from passage
  -> Look up definitions, synonyms, or translations
  -> Create answer pairs
  -> Shuffle answer column
  -> Render matching interface
  -> Validate matches
  -> Update score
```

---

## 3. Passage Reconstruction Puzzle

### Description

A sentence-ordering game where players rebuild scrambled words or phrase chunks from a passage.

### Example

```text
Original: The brave prince entered the dark forest.
Scrambled: entered | the dark forest | The brave prince
Correct: The brave prince entered the dark forest.
```

### Learning Purpose

- Grammar awareness
- Sentence structure
- Word order
- Logical sequencing
- Reading comprehension

### Game Generation Flow

```text
Select sentence or short passage
  -> Split into words or phrase chunks
  -> Shuffle pieces
  -> Render draggable tiles
  -> Player reorders pieces
  -> Compare with original
  -> Update score
```

---

## 4. Word Hunt Challenge

### Description

A passage-based search game where players identify words that match a clue, category, translation, or grammar target.

### Example

```text
Passage: The king walked into the forest and saw a bright fire near the river.
Prompt: Find all nature-related words.
Correct selections: forest, fire, river
```

Alternative translation clue:

```text
Prompt: Find the word that means agni.
Correct selection: fire
```

### Learning Purpose

- Scanning and close reading
- Vocabulary recognition
- Category-based learning
- Translation recall
- Attention to context

### Game Generation Flow

```text
Select passage chunk
  -> Generate target word list
  -> Render passage with clickable words
  -> Player selects matching words
  -> Validate selections
  -> Score by accuracy and time
```

---

## Suggested Project Structure

```text
word_complex/
  README.md
  package.json
  next.config.ts
  vitest.config.mts
  playwright.config.ts
  .env.local
  .env.example

  config/
    games.config.json

  e2e/
    home.spec.ts
    game-flow.spec.ts

  src/
    app/
      page.tsx
      layout.tsx
      api/
        input/
        passages/
        games/
        scores/
        leaderboard/

    components/
      games/
        ContextClozeGame.tsx
        WordMatchGame.tsx
        PassageReconstructionGame.tsx
        WordHuntGame.tsx
      layout/
      shared/

    lib/
      config/
      db/
      preprocessing/
        cleanText.ts
        chunkText.ts
        tokenizeText.ts
      game-generators/
        generateContextCloze.ts
        generateWordMatch.ts
        generatePassageReconstruction.ts
        generateWordHunt.ts
      scoring/
        calculateScore.ts
      types/
        game.ts
        passage.ts
        scoring.ts

    __tests__/
      preprocessing.test.ts
      scoring.test.ts
      context-cloze.test.ts
      word-match.test.ts
      reconstruction.test.ts
      word-hunt.test.ts
```

---

## Common Game API Payload

Each game should return a structured JSON payload so the frontend and ZIM renderer can display the game without needing to know backend details.

Example payload:

```json
{
  "gameId": "context_cloze",
  "passageId": "passage_001",
  "chunkId": "chunk_004",
  "difficulty": "medium",
  "question": "Rama walked through the ______ with Sita.",
  "choices": ["river", "forest", "palace", "mountain"],
  "correctAnswer": "forest",
  "hint": "This word describes a place with many trees.",
  "scoreValue": 10
}
```

All games should follow this idea:

```ts
export type GamePayload = {
  gameId: string;
  passageId: string;
  chunkId: string;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  data: unknown;
  correctAnswer?: unknown;
  hint?: string;
  scoreValue: number;
};
```

---

## MongoDB Data Model

### `passages`

Stores the original passage or uploaded source.

```ts
type Passage = {
  _id: string;
  title: string;
  sourceType: "manual_text" | "local_file" | "api_source" | "dataset" | "dictionary";
  language: string;
  originalText: string;
  createdAt: Date;
};
```

### `chunks`

Stores processed passage chunks used by game generators.

```ts
type Chunk = {
  _id: string;
  passageId: string;
  chunkIndex: number;
  text: string;
  sentences: string[];
  tokens: string[];
  metadata: {
    difficulty?: "easy" | "medium" | "hard";
    language?: string;
  };
  embedding?: number[];
};
```

### `dictionary_entries`

Stores optional word definitions, synonyms, translations, or categories.

```ts
type DictionaryEntry = {
  _id: string;
  word: string;
  language: string;
  translations?: string[];
  definitions?: string[];
  synonyms?: string[];
  antonyms?: string[];
  categories?: string[];
};
```

### `scores`

Stores scoring records.

```ts
type Score = {
  _id: string;
  playerName: string;
  gameId: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  completionTimeSeconds: number;
  createdAt: Date;
};
```

---

## API Route Plan

| Route | Method | Purpose |
|------|--------|---------|
| `/api/input/manual` | POST | Submit manually pasted text |
| `/api/input/file` | POST | Upload local text file |
| `/api/input/url` | POST | Load text from configured URL/API |
| `/api/passages` | GET | List available passages |
| `/api/passages/[id]` | GET | Get one passage and its chunks |
| `/api/games/context-cloze` | POST | Generate Context Cloze puzzle |
| `/api/games/word-match` | POST | Generate Word Match puzzle |
| `/api/games/passage-reconstruction` | POST | Generate Reconstruction puzzle |
| `/api/games/word-hunt` | POST | Generate Word Hunt puzzle |
| `/api/scores` | POST | Save score result |
| `/api/leaderboard` | GET | Get leaderboard results |

---

## Local Setup Instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd word_complex
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/word_complex
NEXT_PUBLIC_APP_NAME=Word Complex
```

If using MongoDB Atlas, replace `MONGODB_URI` with the Atlas connection string.

### 4. Run the development server

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

---

## Testing Instructions

### Run unit tests with Vitest

```bash
npm run test:run
```

### Run Vitest in watch mode

```bash
npm test
```

### Run Playwright end-to-end tests

```bash
npm run e2e
```

### Open Playwright UI mode

```bash
npm run e2e:ui
```

---

## Recommended `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:headed": "playwright test --headed",
    "e2e:report": "playwright show-report"
  }
}
```

---

## Development Workflow

### Branch Naming

Use clear feature branches:

```text
feature/context-cloze
feature/word-match
feature/passage-reconstruction
feature/word-hunt
feature/mongodb-setup
feature/scoring-leaderboard
feature/input-sources
```

### Pull Request Rule

Before opening or merging a pull request:

```bash
npm run build
npm run test:run
npm run e2e
```

At minimum, the feature owner should confirm:

- The app builds.
- Unit tests pass.
- The game does not break the shared payload contract.
- The game can read passage/chunk data from the shared API.
- Scoring updates correctly.

---

## 10-Week MVP Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| Week 1 | Requirements, architecture, repository setup, game contract | Project skeleton and architecture document |
| Week 2 | Input sources and preprocessing | Text can be loaded, cleaned, and normalized |
| Week 3 | Chunking, MongoDB passage storage, retrieval API | Passages are chunked and retrievable |
| Week 4 | Context Cloze Quest | First playable game |
| Week 5 | Word Match / Translation Match | Second playable game |
| Week 6 | Passage Reconstruction Puzzle | Third playable game |
| Week 7 | Word Hunt Challenge | Fourth playable game |
| Week 8 | Offline admin config and platform integration | Games and sources can be enabled/disabled |
| Week 9 | Scoring, leaderboard, UI polish | Integrated playable platform |
| Week 10 | Testing, bug fixes, documentation, demo prep | Final demo-ready MVP |

---

## Definition of Done for Each Game

A game is considered complete when:

- It can generate a puzzle from a selected passage or chunk.
- It uses the shared game payload format.
- It has a working UI rendered in the app.
- It validates answers correctly.
- It sends score data to the scoring system.
- It has at least one Vitest test for game-generation logic.
- It does not break other games.
- It is demo-ready with a sample passage.

---

## MVP Non-Goals

The following are not required for the first MVP:

- Full admin dashboard
- Real-time multiplayer
- Perfect Sanskrit grammar engine
- Advanced AI-generated questions for every game
- Production-scale authentication
- Fully automated curriculum alignment
- Complex morphology/root analysis

These can be considered future enhancements after the core platform is working.

---

## Success Criteria

The MVP is successful if:

- A user can load or select a passage.
- The system preprocesses and chunks the passage.
- MongoDB stores passage and chunk data.
- The user can play all 4 approved games.
- Admin configuration can enable or disable games and input sources offline.
- Scores are tracked and shown on a leaderboard.
- The interface is visually interactive and demo-ready.
- The architecture allows future games, languages, and input sources to be added later.

---

## Final MVP Game Set

The approved 4-game MVP is:

1. **Context Cloze Quest**
2. **Word Match / Translation Match**
3. **Passage Reconstruction Puzzle**
4. **Word Hunt Challenge**

This set covers vocabulary, translation, reading comprehension, sentence structure, close reading, and category recognition while staying realistic for the May 11 to July 20 co-op timeline.
