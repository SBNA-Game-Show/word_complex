# Word Complex Admin Developer Guide

**Purpose:** Technical documentation for developers maintaining or extending the Word Complex Admin Portal.

**Frontend:** React + Vite  
**Backend APIs:** Render Application API + HuggingFace Python API  
**Database:** MongoDB Atlas

---

## Architecture

The Admin Portal is separated from the player application but exists within the same frontend project.

### Entry Files

| File | Purpose |
|------|---------|
| `admin.html` | Loads `admin.jsx` |
| `admin.jsx` | Renders the `AdminPage` component |
| `App.js` | Handles routing for `/admin` and `/tokenized-editor` |

### Main Components

| Component | Purpose |
|-----------|---------|
| `AdminPage.jsx` | Main administration dashboard |
| `TokenizedEditor.jsx` | Displays and edits tokenized stories |
| `TokenizedSanskritEditor.jsx` | Sanskrit token editor |
| `TokenizedEnglishEditor.jsx` | English token editor |

### Services

| Service | Purpose |
|---------|---------|
| `AdminControls.js` | Communicates with the HuggingFace Python API |
| `StorySetService.js` | Manages Story Sets through the Render backend |

---

## API Responsibilities

| Service | Endpoint | Purpose |
|---------|----------|---------|
| `getAllStories()` | `GET /getAll` | Retrieve LearnSanskrit metadata |
| `getUnusedStories()` | `GET /getUnused` | Retrieve Samskrutam metadata |
| `getAllTokenizedStories()` | `GET /getAllTokenized` | Load tokenized stories from MongoDB |
| `uploadStory()` | `POST /upload` | Upload PDF, Word or JSON story |
| `addNewStory()` | `POST /addNew` | Download LearnSanskrit story |
| `addNewSamskrutamStory()` | `POST /addNewStory` | Download Samskrutam story |
| `writeLearnSanskritMeta()` | `POST /writeMeta` | Refresh LearnSanskrit metadata |
| `writeSamskrutamMeta()` | `POST /writeMetaData` | Refresh Samskrutam metadata |
| `StorySetService` | `/admin/storySets` | Create, update, activate and delete Story Sets |

---

## Admin Workflow

### Upload Story

```text
Choose File
      │
      ▼
uploadStory()
      │
      ▼
Python Pipeline
(Clean → Parse → Tokenize)
      │
      ▼
MongoDB tokenized_stories
```

### Download Story

```text
Expand Resource
      │
      ▼
Write Metadata (Optional)
      │
      ▼
Download Story
      │
      ▼
Python Pipeline
      │
      ▼
MongoDB tokenized_stories
```

### Create Story Set

```text
Get Tokenized Stories
        │
        ▼
Select 1–4 Stories
        │
        ▼
Create Story Set
        │
        ▼
Activate Story Set
```

> **Note:** Only **one Story Set** should remain active because the Word Complex game always loads the active Story Set.

---

## Tokenized Editor

`TokenizedEditor` retrieves stories from the application backend and stores changes locally until **Save Changes** is clicked.

### Read-Only Fields

- Story ID
- Title
- Category
- Actors
- English Passage
- Created Date

### Editable Fields

- Story Moral
- Sanskrit Version
- Transliteration
- Tokenized Sanskrit
- Tokenized English

Changes are saved using:

```http
PUT /stories/tokenized/{id}
```

The updated tokenized story is then written back to MongoDB.

---

## Sanskrit & English Token Editors

Both editors manipulate nested token arrays.

Each token contains fields such as:

- `text`
- `lemma`
- `upos`
- `xpos`
- `feats`

Supported operations include:

- Edit token
- Add token
- Delete token
- Add sentence
- Delete sentence

Token colours are determined by the **UPOS (Universal Part of Speech)** value (for example: `NOUN`, `VERB`, `ADJ`, `ADV`, `PRON`) to improve readability.

---

## Routing

### Admin Entry

```text
admin.html
      │
      ▼
admin.jsx
      │
      ▼
AdminPage
```

### Application Routes

| Route | Component |
|--------|-----------|
| `/admin` | `AdminPage` |
| `/tokenized-editor` | `TokenizedEditor` |

All other users continue through the normal Word Complex game flow.

---

## Future Improvements

Recommended enhancements include:

- JWT role validation
- Pagination for tokenized stories
- Bulk story upload
- Story version history
- Audit logging
- POS dropdown menus
- Validation before saving
- Optimistic updates and caching
- Unit tests for services

---

## Troubleshooting

### 404 Errors

Verify:

- `VITE_API_URL`
- API endpoint paths

---

### No Stories Displayed

1. Click **Write Metadata**
2. Click **Refresh**

---

### Upload Fails

Verify:

- Python API is running
- Accepted file type
- MongoDB connection

---

### Story Set Missing

Ensure:

- A Story Set is active
- Render backend is running

---

### Save Changes Fails

Verify:

- `PUT` endpoint
- Request payload structure

---

### Duplicate Stories

Check duplicate detection in the upload endpoint.

---

### Incorrect Token Colours

Verify that valid **UPOS** values are being used.

---

### Performance Issues

Large tokenized stories may require:

- Pagination
- Lazy loading

---

## Data Flow

```text
PDF / Word / JSON
        │
        │
Online Resource
        │
        ▼
Python API
(Clean → Parse → Tokenize)
        │
        ▼
MongoDB tokenized_stories
        │
        ▼
AdminPage
        │
        ▼
TokenizedEditor (Optional)
        │
        ▼
StorySetService
        │
        ▼
Active Story Set
        │
        ▼
Word Complex Game
```