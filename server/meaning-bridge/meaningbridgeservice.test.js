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

// dictionary.js and passages.js have been removed.
// All round generation now uses MongoDB via retrieveStoryById().
// Tests for generateMeaningBridgePuzzle, extractCandidateEntries,
// selectRandomPassageForDifficulty have been removed accordingly.

describe("Meaning Bridge scoring and store logic", () => {
  beforeEach(() => {
    resetRoundFallbackForTests();
    resetScoreFallbackForTests();
  });

  it("scores a perfect round with score, accuracy, and round point", () => {
    const answerKey = {
      left_0_king: "right_0_king",
      left_1_forest: "right_1_forest",
    };

    const result = scoreMeaningBridgeRound({
      answerKey,
      matches: [
        { leftId: "left_0_king",   rightId: "right_0_king" },
        { leftId: "left_1_forest", rightId: "right_1_forest" },
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
        { leftId: "left_0_king",   rightId: "right_0_king" },
        { leftId: "left_1_forest", rightId: "right_1_forest" },
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
    const fakeRound = {
      roundId: "round_test001",
      gameId: "meaning_bridge",
      leftItems: [],
      rightItems: [],
      answerKey: {},
      hints: {},
      scoreRules: { correct: 10, incorrect: 0, hintPenalty: 2, wrongAttemptPenalty: 5 },
    };

    saveRoundFallback(fakeRound);
    expect(getRoundFallback(fakeRound.roundId)?.puzzle.roundId).toBe(fakeRound.roundId);

    const createdAt = new Date().toISOString();

    saveScoreFallback({
      roundId: fakeRound.roundId,
      playerName: "API Tester",
      gameId: "meaning_bridge",
      score: 40,
      accuracy: 100,
      correctMatches: 4,
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
