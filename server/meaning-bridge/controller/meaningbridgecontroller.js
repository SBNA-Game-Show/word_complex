const {
  generatePuzzleFromTokenizedStory,
  generateWordTransliterationPuzzle,
  generateEnglishToSanskritPuzzle,
  generateSentenceMatchPuzzle,
  generateSentenceToEnglishPuzzle,
} = require("../service/generatepuzzle");
const { saveRoundFallback, getRoundFallback } = require("../service/roundstore");
const { saveScoreFallback, getPlayerLeaderboardFallback } = require("../service/scorestore");
const { scoreMeaningBridgeRound } = require("../service/scoreround");
const { retrieveRandomStory } = require("../../raw-data-connect/retrieveTokenizedStoryById");

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
    success: true, ok: true,
    game: "meaning_bridge", status: "ready",
    message: "Meaning Bridge backend module is registered.",
  });
};

const debugStoryStructure = async (req, res) => {
  try {
    const story = await retrieveRandomStory();
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
      return generateEnglishToSanskritPuzzle({ story, pairCount });
    case "sanskrit-to-english":
      return generateSentenceToEnglishPuzzle({ story, pairCount });
    case "word-to-definition":
      return generatePuzzleFromTokenizedStory({ story, pairCount });
    case "word-to-synonym":
    case "sentence-match":
    case "sentence-to-transliteration":
      return generateSentenceMatchPuzzle({ story, pairCount });
    case "word-to-antonym":
      return generateWordTransliterationPuzzle({ story, pairCount });
    case "sentence-to-english":
      return generateSentenceToEnglishPuzzle({ story, pairCount });
    default:
      return generatePuzzleFromTokenizedStory({ story, pairCount });
  }
}

const generateMeaningBridgeRound = async (req, res) => {
  try {
    const { pairCount = 4, mode = "english-to-sanskrit" } = req.body || {};
    const normalizedPairCount = Number(pairCount);

    if (!SUPPORTED_MODES.has(mode)) {
      return res.status(400).json({
        success: false, ok: false,
        error: "Unsupported Meaning Bridge mode.",
      });
    }

    if (!SUPPORTED_PAIR_COUNTS.has(normalizedPairCount)) {
      return res.status(400).json({
        success: false, ok: false,
        error: "Unsupported pair count. Use 4, 5, or 6.",
      });
    }

    const story = await retrieveRandomStory();
    const puzzle = buildPuzzle({ story, mode, pairCount: normalizedPairCount });

    saveRoundFallback(puzzle);

    return res.status(200).json({
      success: true, ok: true,
      puzzle,
      passage: {
        passageId: String(story._id),
        title: story.title && story.title.englishversion ? story.title.englishversion : story.title && story.title.sanskritversion ? story.title.sanskritversion : "Untitled Story",
        text: (story.englishVersion || "").slice(0, 300),
        difficulty: "medium",
        theme: story.category || "Story",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false, ok: false,
      error: error instanceof Error ? error.message : "Failed to generate round.",
    });
  }
};

const generateSentenceMatchRound = async (req, res) => {
  try {
    const { pairCount = 3 } = req.body || {};
    const story = await retrieveRandomStory();
    const puzzle = generateSentenceMatchPuzzle({ story, pairCount: Number(pairCount) });

    saveRoundFallback(puzzle);

    return res.status(200).json({
      success: true, ok: true,
      puzzle,
      passage: {
        passageId: String(story._id),
        title: story.title && story.title.englishversion ? story.title.englishversion : story.title && story.title.sanskritversion ? story.title.sanskritversion : "Untitled Story",
        text: (story.englishVersion || "").slice(0, 300),
        difficulty: "medium",
        theme: story.category || "Story",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false, ok: false,
      error: error instanceof Error ? error.message : "Failed to generate sentence match round.",
    });
  }
};

const submitMeaningBridgeRound = async (req, res) => {
  try {
    const {
      roundId, playerName = "Guest Player", matches = [],
      timeSeconds = 0, hintsUsed = 0, wrongAttempts = 0,
    } = req.body || {};

    if (!roundId) return res.status(400).json({ success: false, ok: false, error: "roundId is required." });
    if (!Array.isArray(matches)) return res.status(400).json({ success: false, ok: false, error: "matches must be an array." });

    const storedRound = getRoundFallback(roundId);
    if (!storedRound) return res.status(404).json({ success: false, ok: false, error: "Round was not found or has expired." });

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
      success: true, ok: true,
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
      success: false, ok: false,
      error: error instanceof Error ? error.message : "Failed to submit round.",
    });
  }
};

const getMeaningBridgeLeaderboard = async (req, res) => {
  const rawLimit = Number(req.query.limit || 10);
  const limit = Math.max(1, Math.min(50, Number.isFinite(rawLimit) ? rawLimit : 10));
  const scores = getPlayerLeaderboardFallback(limit);
  return res.status(200).json({ success: true, ok: true, source: "fallback", scores });
};

module.exports = {
  getMeaningBridgeHealth,
  debugStoryStructure,
  generateMeaningBridgeRound,
  generateSentenceMatchRound,
  submitMeaningBridgeRound,
  getMeaningBridgeLeaderboard,
};
