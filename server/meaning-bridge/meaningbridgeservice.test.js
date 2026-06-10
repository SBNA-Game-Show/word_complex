const { seedDictionary } = require("./data/dictionary");
const { seedPassages } = require("./data/passages");
const {
  generateMeaningBridgePuzzle,
  extractCandidateEntries,
} = require("./service/generatepuzzle");
const { scoreMeaningBridgeRound } = require("./service/scoreround");
const {
  saveRoundFallback,
  getRoundFallback,
  resetRoundFallbackForTests,
} = require("./service/roundstore");
const {
  saveScoreFallback,
  getPlayerLeaderboardFallback,
  resetScoreFallbackForTests,
} = require("./service/scorestore");
const {
  selectRandomPassageForDifficulty,
} = require("./service/selectrandompassage");

describe("Meaning Bridge backend service logic", () => {
  beforeEach(() => {
    resetRoundFallbackForTests();
    resetScoreFallbackForTests();
  });

  it("extracts dictionary-backed words from a passage", () => {
    const passage = seedPassages[0];
    const entries = extractCandidateEntries(passage.text, seedDictionary);

    expect(entries.map((entry) => entry.english)).toEqual(
      expect.arrayContaining(["king", "forest", "fire", "river"]),
    );
  });

  it("generates an English to Sanskrit puzzle", () => {
    const puzzle = generateMeaningBridgePuzzle({
      passage: seedPassages[0],
      dictionary: seedDictionary,
      mode: "english-to-sanskrit",
      difficulty: "easy",
      pairCount: 4,
    });

    expect(puzzle.gameId).toBe("meaning_bridge");
    expect(puzzle.roundId).toMatch(/^round_/);
    expect(puzzle.leftItems).toHaveLength(4);
    expect(puzzle.rightItems).toHaveLength(4);
    expect(Object.keys(puzzle.answerKey)).toHaveLength(4);
    expect(puzzle.scoreRules.correct).toBe(10);
  });

  it("generates hard antonym puzzles using real antonym data", () => {
    const hardPassage = seedPassages.find(
      (passage) => passage.difficulty === "hard",
    );

    const puzzle = generateMeaningBridgePuzzle({
      passage: hardPassage,
      dictionary: seedDictionary,
      mode: "word-to-antonym",
      difficulty: "hard",
      pairCount: 6,
    });

    expect(puzzle.leftItems).toHaveLength(6);
    expect(puzzle.rightItems).toHaveLength(6);
    expect(
      puzzle.rightItems.every(
        (item) =>
          item.sublabel === "antonym" && item.label !== "No antonym available",
      ),
    ).toBe(true);
  });

  it("selects a passage for a requested difficulty and avoids immediate repeat when possible", () => {
    const selected = selectRandomPassageForDifficulty({
      passages: seedPassages,
      difficulty: "easy",
      previousPassageId: "passage_001",
      random: () => 0,
    });

    expect(selected.passageId).toBe("passage_002");
  });

  it("scores a perfect round with score, accuracy, and round point", () => {
    const answerKey = {
      left_0_king: "right_0_king",
      left_1_forest: "right_1_forest",
    };

    const result = scoreMeaningBridgeRound({
      answerKey,
      matches: [
        {
          leftId: "left_0_king",
          rightId: "right_0_king",
        },
        {
          leftId: "left_1_forest",
          rightId: "right_1_forest",
        },
      ],
      hintsUsed: 0,
      wrongAttempts: 0,
    });

    expect(result.score).toBe(20);
    expect(result.accuracy).toBe(100);
    expect(result.roundPoints).toBe(1);
    expect(result.perfectRound).toBe(true);
  });

  it("removes round point when a wrong attempt occurred", () => {
    const answerKey = {
      left_0_king: "right_0_king",
      left_1_forest: "right_1_forest",
    };

    const result = scoreMeaningBridgeRound({
      answerKey,
      matches: [
        {
          leftId: "left_0_king",
          rightId: "right_0_king",
        },
        {
          leftId: "left_1_forest",
          rightId: "right_1_forest",
        },
      ],
      hintsUsed: 0,
      wrongAttempts: 1,
    });

    expect(result.accuracy).toBe(100);
    expect(result.roundPoints).toBe(0);
    expect(result.perfectRound).toBe(false);
    expect(result.score).toBe(15);
  });

  it("stores fallback rounds and aggregates player leaderboard records", () => {
    const puzzle = generateMeaningBridgePuzzle({
      passage: seedPassages[0],
      dictionary: seedDictionary,
      mode: "english-to-sanskrit",
      difficulty: "easy",
      pairCount: 4,
    });

    saveRoundFallback(puzzle);

    expect(getRoundFallback(puzzle.roundId)?.puzzle.roundId).toBe(
      puzzle.roundId,
    );

    const createdAt = new Date().toISOString();

    saveScoreFallback({
      roundId: puzzle.roundId,
      playerName: "API Tester",
      gameId: "meaning_bridge",
      score: 40,
      accuracy: 100,
      correctMatches: 4,
      incorrectMatches: 0,
      totalMatches: 4,
      wrongAttempts: 0,
      roundPoints: 1,
      perfectRound: true,
      timeSeconds: 15,
      hintsUsed: 0,
      createdAt,
    });

    saveScoreFallback({
      roundId: "round_second",
      playerName: "api tester",
      gameId: "meaning_bridge",
      score: 35,
      accuracy: 100,
      correctMatches: 4,
      incorrectMatches: 0,
      totalMatches: 4,
      wrongAttempts: 1,
      roundPoints: 0,
      perfectRound: false,
      timeSeconds: 18,
      hintsUsed: 0,
      createdAt,
    });

    const leaderboard = getPlayerLeaderboardFallback(5);
    const tester = leaderboard.find(
      (entry) => entry.normalizedPlayerName === "api tester",
    );

    expect(tester).toMatchObject({
      totalScore: 75,
      roundsPlayed: 2,
      roundPoints: 1,
      perfectRounds: 1,
      failedRounds: 1,
      accuracyAverage: 100,
    });
  });
});
