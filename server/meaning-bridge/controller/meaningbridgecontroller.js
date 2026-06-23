const {
  generatePuzzleFromTokenizedStory,
  generateWordTransliterationPuzzle,
  generateSentenceMatchPuzzle,
  generateSynonymMatchPuzzle,
  generateAntonymMatchPuzzle,
  generateWordDefinitionPuzzle,
} = require("../service/generatepuzzle");
const {
  saveRoundFallback,
  getRoundFallback,
} = require("../service/roundstore");
const {
  saveScoreFallback,
  getPlayerLeaderboardFallback,
} = require("../service/scorestore");
const { scoreMeaningBridgeRound } = require("../service/scoreround");
const {
  retrieveStoryById,
} = require("../../raw-data-connect/retrieveTokenizedStoryById");
const retrieveAllStories = require("../../raw-data-connect/retrieveAllTokenizedStories");

const HARDCODED_STORY_ID = "292f2009-96bb-4a3c-b856-e04214e852f8";

const DEFAULT_MEANING_BRIDGE_SOURCE = "mongo-eligible-story";

function getStoryTitle(story) {
  if (story?.title?.englishversion) {
    return story.title.englishversion;
  }

  if (story?.title?.sanskritversion) {
    return story.title.sanskritversion;
  }

  if (typeof story?.title === "string" && story.title.trim()) {
    return story.title.trim();
  }

  return "Untitled Story";
}

function buildPassageFromStory(story, source) {
  return {
    passageId: String(story._id),
    title: getStoryTitle(story),
    text: String(story.englishVersion || "").slice(0, 300),
    difficulty: "medium",
    theme: story.category || "Story",
    source,
  };
}

function hasStory(candidateStories, story) {
  return candidateStories.some(
    (candidate) => String(candidate.story?._id) === String(story?._id),
  );
}

async function getMeaningBridgeCandidateStories({ requestedStoryId } = {}) {
  const candidates = [];

  const preferredIds = [requestedStoryId, HARDCODED_STORY_ID].filter(Boolean);

  for (const storyId of preferredIds) {
    try {
      const story = await retrieveStoryById(storyId);

      if (story && !hasStory(candidates, story)) {
        candidates.push({
          story,
          source:
            storyId === requestedStoryId
              ? "mongo-requested-story"
              : "mongo-preferred-story",
        });
      }
    } catch (error) {
      console.warn(
        `[MeaningBridge] Story ${storyId} unavailable: ${error.message}`,
      );
    }
  }

  try {
    const stories = await retrieveAllStories();

    for (const story of stories) {
      if (story && !hasStory(candidates, story)) {
        candidates.push({
          story,
          source: DEFAULT_MEANING_BRIDGE_SOURCE,
        });
      }
    }
  } catch (error) {
    console.warn(
      `[MeaningBridge] Could not retrieve all tokenized stories: ${error.message}`,
    );
  }

  return candidates;
}

function buildPuzzleFromCandidateStories({ candidates, mode, pairCount }) {
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const puzzle = buildPuzzle({
        story: candidate.story,
        mode,
        pairCount,
      });

      if ((puzzle.leftItems || []).length < pairCount) {
        throw new Error(
          `Story only produced ${(puzzle.leftItems || []).length} pairs; ${pairCount} required.`,
        );
      }

      return {
        story: candidate.story,
        source: candidate.source,
        puzzle,
      };
    } catch (error) {
      lastError = error;
      console.warn(
        `[MeaningBridge] Story ${candidate.story?._id || "unknown"} could not generate ${mode}: ${error.message}`,
      );
    }
  }

  throw (
    lastError ||
    new Error(
      "No eligible tokenized story could generate this Meaning Bridge round.",
    )
  );
}

const SUPPORTED_PAIR_COUNTS = new Set([4, 5, 6]);

const SUPPORTED_MODES = new Set([
  "english-to-sanskrit",
  "sanskrit-to-english",
  "word-to-definition",
  "word-to-synonym",
  "word-to-antonym",
  "sentence-match",
  "sentence-to-transliteration",
  "sentence-to-english",
]);

const getMeaningBridgeHealth = async (req, res) => {
  return res.status(200).json({
    success: true,
    ok: true,
    game: "meaning_bridge",
    status: "ready",
    message: "Meaning Bridge backend module is registered.",
  });
};

const debugStoryStructure = async (req, res) => {
  try {
    const story = await retrieveStoryById(HARDCODED_STORY_ID);
    const topLevelKeys = Object.keys(story);
    const tokenizedVersion = story.tokenized_sanskrit_version;
    let tokenSample = null;
    let structureInfo = {};

    if (Array.isArray(tokenizedVersion)) {
      structureInfo.type = "array";
      structureInfo.length = tokenizedVersion.length;
      const firstItem = tokenizedVersion[0];
      if (Array.isArray(firstItem)) {
        structureInfo.firstItemType = "array";
        structureInfo.firstItemLength = firstItem.length;
        tokenSample = firstItem.slice(0, 3);
      } else if (firstItem && typeof firstItem === "object") {
        structureInfo.firstItemType = "object";
        structureInfo.firstItemKeys = Object.keys(firstItem);
        tokenSample = firstItem;
      }
    }

    return res.status(200).json({
      success: true,
      storyId: story._id,
      storyTopLevelKeys: topLevelKeys,
      title: story.title,
      category: story.category,
      tokenizedSanskritVersionInfo: structureInfo,
      tokenSample,
      englishTokenSample: (story.tokenized_english_version || []).slice(0, 3),
      sanskritVersionSample: (story.sanskritVersion || []).slice(0, 2),
      englishVersionPreview: (story.englishVersion || "").slice(0, 200),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

function buildPuzzle({ story, mode, pairCount }) {
  switch (mode) {
    case "english-to-sanskrit":
    case "sanskrit-to-english":
      throw new Error("COMING_SOON");
    case "word-to-definition":
      return generateWordDefinitionPuzzle({ story, pairCount });
    case "word-to-synonym":
      return generateSynonymMatchPuzzle({ story, pairCount });
    case "word-to-antonym":
      return generateAntonymMatchPuzzle({ story, pairCount });
    case "sentence-match":
    case "sentence-to-transliteration":
      return generateSentenceMatchPuzzle({ story, pairCount });
    default:
      return generatePuzzleFromTokenizedStory({ story, pairCount });
  }
}

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
        error: "Unsupported Meaning Bridge mode.",
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

    saveRoundFallback(puzzle);

    return res.status(200).json({
      success: true,
      ok: true,
      source,
      puzzle,
      passage: buildPassageFromStory(story, source),
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

const generateSentenceMatchRound = async (req, res) => {
  try {
    const { pairCount = 3, storyId = null } = req.body || {};

    const normalizedPairCount = Number(pairCount) || 3;

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
      mode: "sentence-match",
      pairCount: normalizedPairCount,
    });

    saveRoundFallback(puzzle);

    return res.status(200).json({
      success: true,
      ok: true,
      source,
      puzzle,
      passage: buildPassageFromStory(story, source),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate sentence match round.",
    });
  }
};

const submitMeaningBridgeRound = async (req, res) => {
  try {
    const {
      roundId,
      playerName = "Guest Player",
      matches = [],
      timeSeconds = 0,
      hintsUsed = 0,
      wrongAttempts = 0,
    } = req.body || {};

    if (!roundId)
      return res
        .status(400)
        .json({ success: false, ok: false, error: "roundId is required." });
    if (!Array.isArray(matches))
      return res
        .status(400)
        .json({
          success: false,
          ok: false,
          error: "matches must be an array.",
        });

    const storedRound = getRoundFallback(roundId);
    if (!storedRound)
      return res
        .status(404)
        .json({
          success: false,
          ok: false,
          error: "Round was not found or has expired.",
        });

    const { puzzle } = storedRound;
    const scoreResult = scoreMeaningBridgeRound({
      answerKey: puzzle.answerKey,
      matches,
      hintsUsed: Number(hintsUsed) || 0,
      wrongAttempts: Number(wrongAttempts) || 0,
      correctValue: puzzle.scoreRules.correct,
      incorrectValue: puzzle.scoreRules.incorrect,
      hintPenalty: puzzle.scoreRules.hintPenalty,
      wrongAttemptPenalty: puzzle.scoreRules.wrongAttemptPenalty,
    });

    const createdAt = new Date().toISOString();
    const scoreRecord = {
      roundId,
      playerName: String(playerName || "").trim() || "Guest Player",
      gameId: "meaning_bridge",
      score: scoreResult.score,
      accuracy: scoreResult.accuracy,
      timeSeconds: Number(timeSeconds) || 0,
      hintsUsed: Number(hintsUsed) || 0,
      wrongAttempts: Number(wrongAttempts) || 0,
      correctMatches: scoreResult.correctMatches,
      totalMatches: scoreResult.totalMatches,
      roundPoints: scoreResult.roundPoints,
      perfectRound: scoreResult.perfectRound,
      createdAt,
    };

    const updatedPlayer = saveScoreFallback(scoreRecord);

    return res.status(200).json({
      success: true,
      ok: true,
      roundId,
      playerName: scoreRecord.playerName,
      score: scoreResult.score,
      accuracy: scoreResult.accuracy,
      correctMatches: scoreResult.correctMatches,
      totalMatches: scoreResult.totalMatches,
      wrongAttempts: scoreResult.wrongAttempts,
      hintsUsed: Number(hintsUsed) || 0,
      timeSeconds: Number(timeSeconds) || 0,
      roundPoints: scoreResult.roundPoints,
      perfectRound: scoreResult.perfectRound,
      message: scoreResult.message,
      createdAt,
      scoreRecord,
      playerRecord: updatedPlayer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ok: false,
      error: error instanceof Error ? error.message : "Failed to submit round.",
    });
  }
};

const getMeaningBridgeLeaderboard = async (req, res) => {
  const rawLimit = Number(req.query.limit || 10);
  const limit = Math.max(
    1,
    Math.min(50, Number.isFinite(rawLimit) ? rawLimit : 10),
  );
  const scores = getPlayerLeaderboardFallback(limit);
  return res
    .status(200)
    .json({ success: true, ok: true, source: "fallback", scores });
};

module.exports = {
  getMeaningBridgeHealth,
  debugStoryStructure,
  generateMeaningBridgeRound,
  generateSentenceMatchRound,
  submitMeaningBridgeRound,
  getMeaningBridgeLeaderboard,
};
