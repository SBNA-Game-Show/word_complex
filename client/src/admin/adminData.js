// ⚠️ MOCK DATA — TEMPORARY, NEEDS TO BE DELETED LATER ONCE REAL DATA IS FETCHING.
// Location: client/src/admin/adminData.js  (single source for all admin mock data)
//
// There is NO backend wired here. These are placeholder values so the admin UI
// can be laid out and reviewed. Game names below are the real ones from the
// registry; story titles are made up. Each export maps to a real data source we
// will swap in later:
//   - getLeaderboard  -> per-game leaderboard (game collection / scores)
//   - inputSources    -> up to 5 admin-configured input sources
//   - tokenizedStories-> stories read from DB via the preprocessor/API
//
// Requirements being illustrated (from the Word Complex brief):
//   1. up to 5 input sources (preconfigured by admin)
//   2. up to 4 games (preconfigured by admin)
//   3. admin can swap games / input sources offline
//   4. data preprocessor reads input text through an API

const PLAYERS = ["Jones", "Rajan", "Maya", "Ace", "Priya", "Sam", "Leo", "Nina"];

// Deterministic mock leaderboard so each game shows a stable, distinct board.
export function getLeaderboard(seed = 0) {
  return Array.from({ length: 6 }, (_, i) => ({
    rank: i + 1,
    player: PLAYERS[(seed + i) % PLAYERS.length],
    score: 7000 - i * 350 - seed * 40,
    date: "7/8/2025",
  }));
}

// Up to 5 input sources. "empty" slots show the admin still has room to add.
export const inputSources = [
  { id: "src-1", name: "Aesop's Fables", type: "Web scraper", status: "active" },
  { id: "src-2", name: "Panchatantra Stories", type: "Web scraper", status: "active" },
  { id: "src-3", name: "Manual upload", type: "Upload", status: "active" },
  { id: "src-4", name: "Public Domain API", type: "API", status: "disabled" },
  { id: "src-5", name: "", type: "", status: "empty" },
];

export const SOURCE_TYPES = ["Web scraper", "API", "Upload"];

// Stories the preprocessor has tokenized and stored in the DB. `inCollection`
// marks whether the admin has pushed it into the playable game collection.
export const tokenizedStories = [
  { id: "st-1", title: "The Tortoise and the Hare", source: "Aesop's Fables", tokens: 142, inCollection: true },
  { id: "st-2", title: "The Lion and the Mouse", source: "Aesop's Fables", tokens: 98, inCollection: true },
  { id: "st-3", title: "The Monkey and the Crocodile", source: "Panchatantra Stories", tokens: 211, inCollection: false },
  { id: "st-4", title: "The Fox and the Grapes", source: "Aesop's Fables", tokens: 76, inCollection: false },
  { id: "st-5", title: "The Blue Jackal", source: "Panchatantra Stories", tokens: 180, inCollection: false },
];

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];
