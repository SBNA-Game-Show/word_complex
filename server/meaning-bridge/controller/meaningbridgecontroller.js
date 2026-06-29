const {
  generateSynonymMatchPuzzle,
  generateAntonymMatchPuzzle,
  generateDefinitionMatchPuzzle,
} = require("../service/generatepuzzle");
const {
  retrieveStoryById,
} = require("../../raw-data-connect/retrieveTokenizedStoryById");

const HARDCODED_STORY_ID = "73a1ae3b-3c35-414b-8f9d-e4e241fe49e1";

const SUPPORTED_MODES = new Set([
  "word-to-synonym",
  "word-to-antonym",
  "word-to-definition",
]);

const SUPPORTED_PAIR_COUNTS = new Set([4, 5, 6]);

const leaderboardByPlayer = new Map();
const submittedRounds = new Set();
const MAX_LEADERBOARD_ENTRIES = 100;

function sanitizePlayerName(playerName) {
  const trimmed = String(playerName || "").trim();

  if (!trimmed) {
    return "Guest";
  }

  return trimmed.slice(0, 40);
}

function getPlayerKey(playerName) {
  return sanitizePlayerName(playerName).toLowerCase();
}

function calculateSubmittedRoundStats({
  matches,
  hintsUsed,
  wrongAttempts,
  timeSeconds,
}) {
  const safeMatches = Array.isArray(matches) ? matches : [];
  const correctMatches = safeMatches.length;
  const safeHintsUsed = Math.max(0, Number(hintsUsed) || 0);
  const safeWrongAttempts = Math.max(0, Number(wrongAttempts) || 0);
  const safeTimeSeconds = Math.max(0, Number(timeSeconds) || 0);

  const totalAttempts = correctMatches + safeWrongAttempts;
  const accuracy =
    totalAttempts > 0 ? Math.round((correctMatches / totalAttempts) * 100) : 0;

  const score = Math.max(
    0,
    correctMatches * 10 - safeHintsUsed * 2 - safeWrongAttempts * 5,
  );

  return {
    score,
    correctMatches,
    hintsUsed: safeHintsUsed,
    wrongAttempts: safeWrongAttempts,
    timeSeconds: safeTimeSeconds,
    accuracy,
  };
}

function getSortedLeaderboard(limit = 10) {
  const safeLimit = Math.min(
    MAX_LEADERBOARD_ENTRIES,
    Math.max(1, Number(limit) || 10),
  );

  return [...leaderboardByPlayer.values()]
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.accuracyAverage !== a.accuracyAverage) {
        return b.accuracyAverage - a.accuracyAverage;
      }
      return new Date(b.lastSubmittedAt) - new Date(a.lastSubmittedAt);
    })
    .slice(0, safeLimit);
}

function buildPuzzle({ story, mode, pairCount }) {
  switch (mode) {
    case "word-to-synonym":
      return generateSynonymMatchPuzzle({ story, pairCount });
    case "word-to-antonym":
      return generateAntonymMatchPuzzle({ story, pairCount });
    case "word-to-definition":
      return generateDefinitionMatchPuzzle({ story, pairCount });
    default:
      throw new Error(`Unsupported mode: ${mode}`);
  }
}

function getPassageTitle(story) {
  if (story.title && story.title.englishversion)
    return story.title.englishversion;
  if (story.title && story.title.sanskritversion)
    return story.title.sanskritversion;
  return "Untitled Story";
}

async function getMeaningBridgeCandidateStories({
  requestedStoryId = null,
} = {}) {
  const storyIds = [];
  if (requestedStoryId) storyIds.push(requestedStoryId);
  if (!storyIds.includes(HARDCODED_STORY_ID)) storyIds.push(HARDCODED_STORY_ID);

  const stories = [];
  for (const storyId of storyIds) {
    try {
      const story = await retrieveStoryById(storyId);
      if (story) stories.push(story);
    } catch (error) {
      // Skip stories that can't be retrieved; fall back to the next candidate.
    }
    //just for checking
    //checkign again test
  }

  return stories;
}

function buildPuzzleFromCandidateStories({ candidates, mode, pairCount }) {
  let lastError = null;

  for (const story of candidates) {
    try {
      const puzzle = buildPuzzle({ story, mode, pairCount });
      return { story, source: String(story._id), puzzle };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError
      ? `Could not build a ${mode} puzzle from any story: ${lastError.message}`
      : `Could not build a ${mode} puzzle from any story.`,
  );
}

const getMeaningBridgeHealth = async (req, res) => {
  return res.status(200).json({
    success: true,
    ok: true,
    game: "meaning_bridge",
    status: "ready",
    message: "Meaning Bridge backend is ready.",
  });
};

const generateMeaningBridgeRound = async (req, res) => {
  try {
    const {
      pairCount = 4,
      mode = "word-to-synonym",
      storyId = null,
    } = req.body || {};

    const normalizedPairCount = Number(pairCount);

    if (!SUPPORTED_MODES.has(mode)) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: `Unsupported mode. Supported: ${[...SUPPORTED_MODES].join(", ")}`,
      });
    }

    if (!SUPPORTED_PAIR_COUNTS.has(normalizedPairCount)) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: "Unsupported pair count. Use 4, 5, or 6.",
      });
    }

    const candidates = await getMeaningBridgeCandidateStories({
      requestedStoryId: storyId,
    });

    if (!candidates.length) {
      return res.status(500).json({
        success: false,
        ok: false,
        error: "No tokenized stories were available for Meaning Bridge.",
      });
    }

    const { story, source, puzzle } = buildPuzzleFromCandidateStories({
      candidates,
      mode,
      pairCount: normalizedPairCount,
    });

    return res.status(200).json({
      success: true,
      ok: true,
      puzzle,
      passage: {
        passageId: String(story._id),
        title: getPassageTitle(story),
        text: (story.englishVersion || "").slice(0, 300),
        theme: story.category || "Story",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to generate round.",
    });
  }
};

const submitMeaningBridgeScore = async (req, res) => {
  try {
    const {
      roundId,
      playerName = "Guest",
      matches = [],
      timeSeconds = 0,
      hintsUsed = 0,
      wrongAttempts = 0,
    } = req.body || {};

    const safeRoundId = String(roundId || "").trim();

    if (!safeRoundId) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: "roundId is required.",
      });
    }

    if (!Array.isArray(matches)) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: "matches must be an array.",
      });
    }

    const safePlayerName = sanitizePlayerName(playerName);
    const playerKey = getPlayerKey(safePlayerName);
    const submissionKey = `${playerKey}:${safeRoundId}`;

    if (submittedRounds.has(submissionKey)) {
      return res.status(200).json({
        success: true,
        ok: true,
        message: "Score already saved for this round.",
        duplicate: true,
        scores: getSortedLeaderboard(10),
      });
    }

    const roundStats = calculateSubmittedRoundStats({
      matches,
      hintsUsed,
      wrongAttempts,
      timeSeconds,
    });

    const existing = leaderboardByPlayer.get(playerKey) || {
      playerName: safePlayerName,
      totalScore: 0,
      roundsPlayed: 0,
      totalCorrectMatches: 0,
      totalWrongAttempts: 0,
      totalHintsUsed: 0,
      totalTimeSeconds: 0,
      accuracyAverage: 0,
      bestRoundScore: 0,
      lastSubmittedUsed: 0,
      totalTimeSeconds: 0,
      accuracyAverage: 0,
      bestRoundScore: 0,
      lastSubmittedAt: null,
    };

    existing.playerName = safePlayerName;
    existing.totalScore += roundStats.score;
    existing.roundsPlayed += 1;
    existing.totalCorrectMatches += roundStats.correctMatches;
    existing.totalWrongAttempts += roundStats.wrongAttempts;
    existing.totalHintsUsed += roundStats.hintsUsed;
    existing.totalTimeSeconds += roundStats.timeSeconds;
    existing.bestRoundScore = Math.max(
      existing.bestRoundScore,
      roundStats.score,
    );
    existing.lastSubmittedAt = new Date().toISOString();

    const totalAttempts =
      existing.totalCorrectMatches + existing.totalWrongAttempts;

    existing.accuracyAverage =
      totalAttempts > 0
        ? Math.round((existing.totalCorrectMatches / totalAttempts) * 100)
        : 0;

    leaderboardByPlayer.set(playerKey, existing);
    submittedRounds.add(submissionKey);

    return res.status(200).json({
      success: true,
      ok: true,
      message: "Score saved! Great bridge building.",
      score: roundStats.score,
      entry: existing,
      scores: getSortedLeaderboard(10),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ok: false,
      error: error instanceof Error ? error.message : "Failed to submit score.",
    });
  }
};

const getMeaningBridgeLeaderboard = async (req, res) => {
  try {
    const limit = req.query?.limit || 10;

    return res.status(200).json({
      success: true,
      ok: true,
      scores: getSortedLeaderboard(limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch leaderboard.",
    });
  }
};

module.exports = {
  getMeaningBridgeHealth,
  generateMeaningBridgeRound,
  submitMeaningBridgeScore,
  getMeaningBridgeLeaderboard,
};
