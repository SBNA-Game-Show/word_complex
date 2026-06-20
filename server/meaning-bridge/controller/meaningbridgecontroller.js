const { seedDictionary } = require("../data/dictionary");
const { seedPassages } = require("../data/passages");
const { generateMeaningBridgePuzzle } = require("../service/generatepuzzle");
const {
  selectRandomPassageForDifficulty,
} = require("../service/selectrandompassage");
const {
  saveRoundFallback,
  getRoundFallback,
} = require("../service/roundstore");
const {
  saveScoreFallback,
  getPlayerLeaderboardFallback,
} = require("../service/scorestore");
const { scoreMeaningBridgeRound } = require("../service/scoreround");

const SUPPORTED_MODES = new Set([
  "english-to-sanskrit",
  "sanskrit-to-english",
  "word-to-definition",
  "word-to-synonym",
  "word-to-antonym",
]);

const SUPPORTED_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const SUPPORTED_PAIR_COUNTS = new Set([4, 5, 6]);

const getMeaningBridgeHealth = async (req, res) => {
  return res.status(200).json({
    success: true,
    ok: true,
    game: "meaning_bridge",
    status: "ready",
    message: "Meaning Bridge backend module is registered.",
  });
};

const generateMeaningBridgeRound = async (req, res) => {
  try {
    const {
      mode = "english-to-sanskrit",
      difficulty = "medium",
      pairCount = 4,
      passageId,
      previousPassageId,
    } = req.body || {};

    const normalizedPairCount = Number(pairCount);

    if (!SUPPORTED_MODES.has(mode)) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: "Unsupported Meaning Bridge mode.",
      });
    }

    if (!SUPPORTED_DIFFICULTIES.has(difficulty)) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: "Unsupported Meaning Bridge difficulty.",
      });
    }

    if (!SUPPORTED_PAIR_COUNTS.has(normalizedPairCount)) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: "Unsupported Meaning Bridge pair count.",
      });
    }

    const selectedPassage = passageId
      ? seedPassages.find((passage) => passage.passageId === passageId)
      : selectRandomPassageForDifficulty({
          passages: seedPassages,
          difficulty,
          previousPassageId,
        });

    if (!selectedPassage) {
      return res.status(404).json({
        success: false,
        ok: false,
        error: "Requested passage was not found.",
      });
    }

    const puzzle = generateMeaningBridgePuzzle({
      passage: selectedPassage,
      dictionary: seedDictionary,
      mode,
      difficulty,
      pairCount: normalizedPairCount,
    });

    saveRoundFallback(puzzle);

    return res.status(200).json({
      success: true,
      ok: true,
      puzzle,
      passage: selectedPassage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate Meaning Bridge round.",
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

    if (!roundId) {
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

    const storedRound = getRoundFallback(roundId);

    if (!storedRound) {
      return res.status(404).json({
        success: false,
        ok: false,
        error: "Round was not found or has expired.",
      });
    }

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
      correctMatches: scoreResult.correctMatches,
      incorrectMatches: scoreResult.incorrectMatches,
      totalMatches: scoreResult.totalMatches,
      wrongAttempts: scoreResult.wrongAttempts,
      roundPoints: scoreResult.roundPoints,
      perfectRound: scoreResult.perfectRound,
      timeSeconds: Number(timeSeconds) || 0,
      hintsUsed: Number(hintsUsed) || 0,
      createdAt,
    };

    const playerRecord = saveScoreFallback(scoreRecord);

    return res.status(200).json({
      success: true,
      ok: true,
      ...scoreResult,
      timeSeconds: scoreRecord.timeSeconds,
      hintsUsed: scoreRecord.hintsUsed,
      scoreRecord,
      playerRecord,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit Meaning Bridge round.",
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

  return res.status(200).json({
    success: true,
    ok: true,
    source: "fallback",
    scores,
  });
};

module.exports = {
  getMeaningBridgeHealth,
  generateMeaningBridgeRound,
  submitMeaningBridgeRound,
  getMeaningBridgeLeaderboard,
};
