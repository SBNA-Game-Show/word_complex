# Pushing Scores to the Leaderboard

For the score check. One function does everything — you don't read or compute anything in the DB yourself.

## The function

```js
const { submitLeaderboardScore } = require("./leaderboard/service/leaderboardWriteService");

await submitLeaderboardScore({
  uuid,      // the player's Firebase UID
  game,      // which game (exact string, see below)
  score,     // normalized score, 0–100
  bestTime,  // completion time in ms (lower = better)
});
```

## The 4 `game` values (must match exactly)

`WordHunt` · `PassageReconstruction` · `ContextQuiz` · `MeaningBridge`

## What it does for you

- **Keeps the best only** — if the new `score` is lower than what's stored, it's ignored (same for a slower `bestTime`). So you can call it on every game finish; no need to check the previous score first.
- **Recomputes `masterScore`** automatically (sum of the player's 4 game scores).
- **Creates the player** on their first score — no setup needed.

## Call it once, when the game ends

```js
async function checkScore(uuid, finalScore, timeMs) {
  const normalized = (finalScore / maxScore) * 100; // your scoring lives here
  await submitLeaderboardScore({
    uuid,
    game: "WordHunt",
    score: normalized,
    bestTime: timeMs,
  });
}
```

Don't call it in a game loop — once per completed round is enough.

## Notes

- `score` should already be normalized to 0–100 (your side owns the scoring math). The leaderboard just stores what you send.
- It throws if `game` isn't one of the 4 strings, or if `score`/`bestTime` aren't numbers — catch and log if you want.
- That's it. Reading/ranking/leaderboard display is handled separately.
