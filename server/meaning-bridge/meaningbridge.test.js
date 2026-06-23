const request = require("supertest");

jest.mock("../raw-data-connect/retrieveTokenizedStoryById", () => ({
  retrieveStoryById: jest.fn(),
  retrieveRandomStory: jest.fn(),
}));

const {
  retrieveStoryById,
} = require("../raw-data-connect/retrieveTokenizedStoryById");
const app = require("../app");
const { resetRoundFallbackForTests } = require("./service/roundstore");
const { resetScoreFallbackForTests } = require("./service/scorestore");
const { API_KEY_HEADER } = require("./middleware/apikey");

const MOCK_STORY = {
  _id: "292f2009-96bb-4a3c-b856-e04214e852f8",
  title: { englishversion: "Mock Meaning Bridge Story" },
  category: "Test Story",
  englishVersion:
    "A bright rabbit moved quickly through the calm forest toward a happy village.",
  tokenized_english_version: [
    {
      text: "bright",
      pos: "ADJ",
      synonyms: ["smart", "clever"],
      antonyms: ["dark"],
    },
    {
      text: "quickly",
      pos: "ADV",
      synonyms: ["rapidly", "swiftly"],
      antonyms: ["slowly"],
    },
    {
      text: "calm",
      pos: "ADJ",
      synonyms: ["peaceful", "quiet"],
      antonyms: ["angry"],
    },
    {
      text: "happy",
      pos: "ADJ",
      synonyms: ["joyful", "glad"],
      antonyms: ["sad"],
    },
    {
      text: "village",
      pos: "NOUN",
      synonyms: ["settlement", "town"],
      antonyms: ["wilderness"],
    },
  ],
  sanskritVersion: ["रामः वनं गच्छति", "सीता पुस्तकम् पठति"],
  transliteratedVersion: ["rāmaḥ vanaṃ gacchati", "sītā pustakam paṭhati"],
  tokenized_sanskrit_version: [],
};

describe("Meaning Bridge API routes", () => {
  beforeEach(() => {
    resetRoundFallbackForTests();
    resetScoreFallbackForTests();
    retrieveStoryById.mockResolvedValue(MOCK_STORY);
  });
  afterEach(() => {
    delete process.env.MEANING_BRIDGE_REQUIRE_API_KEY;
    delete process.env.MEANING_BRIDGE_API_KEY;
  });

  it("should expose a Meaning Bridge health endpoint", async () => {
    const response = await request(app)
      .get("/api/v1/meaningBridge/health")
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      ok: true,
      game: "meaning_bridge",
      status: "ready",
      message: "Meaning Bridge backend module is registered.",
    });
  });

  it("should generate a Meaning Bridge puzzle round", async () => {
    const response = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .send({
        mode: "word-to-synonym",
        difficulty: "easy",
        pairCount: 4,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      ok: true,
    });

    expect(response.body.puzzle.gameId).toBe("meaning_bridge");
    expect(response.body.puzzle.roundId).toMatch(/^round_/);
    expect(response.body.puzzle.leftItems).toHaveLength(4);
    expect(response.body.puzzle.rightItems).toHaveLength(4);
    expect(Object.keys(response.body.puzzle.answerKey)).toHaveLength(4);
    expect(response.body.passage.title).toBeTruthy();
  });

  it("should reject unsupported generation options", async () => {
    const response = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .send({
        mode: "not-a-real-mode",
        difficulty: "easy",
        pairCount: 4,
      })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      ok: false,
      error: "Unsupported Meaning Bridge mode.",
    });
  });

  it("should submit a generated round and return a perfect score", async () => {
    const generateResponse = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .send({
        mode: "word-to-synonym",
        difficulty: "easy",
        pairCount: 4,
      })
      .expect(200);

    const puzzle = generateResponse.body.puzzle;

    const matches = Object.entries(puzzle.answerKey).map(
      ([leftId, rightId]) => ({
        leftId,
        rightId,
      }),
    );

    const submitResponse = await request(app)
      .post("/api/v1/meaningBridge/submit")
      .send({
        roundId: puzzle.roundId,
        playerName: "API Tester",
        matches,
        timeSeconds: 12,
        hintsUsed: 0,
        wrongAttempts: 0,
      })
      .expect(200);

    expect(submitResponse.body).toMatchObject({
      success: true,
      ok: true,
      score: 40,
      accuracy: 100,
      correctMatches: 4,
      totalMatches: 4,
      roundPoints: 1,
      perfectRound: true,
    });

    expect(submitResponse.body.scoreRecord.playerName).toBe("API Tester");
    expect(submitResponse.body.playerRecord.roundsPlayed).toBe(1);
  });

  it("should reject submit when the round does not exist", async () => {
    const response = await request(app)
      .post("/api/v1/meaningBridge/submit")
      .send({
        roundId: "missing_round",
        playerName: "API Tester",
        matches: [],
      })
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      ok: false,
      error: "Round was not found or has expired.",
    });
  });

  it("should return fallback leaderboard scores", async () => {
    const generateResponse = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .send({
        mode: "word-to-synonym",
        difficulty: "easy",
        pairCount: 4,
      })
      .expect(200);

    const puzzle = generateResponse.body.puzzle;

    const matches = Object.entries(puzzle.answerKey).map(
      ([leftId, rightId]) => ({
        leftId,
        rightId,
      }),
    );

    await request(app)
      .post("/api/v1/meaningBridge/submit")
      .send({
        roundId: puzzle.roundId,
        playerName: "API Tester",
        matches,
        timeSeconds: 12,
        hintsUsed: 0,
        wrongAttempts: 0,
      })
      .expect(200);

    const leaderboardResponse = await request(app)
      .get("/api/v1/meaningBridge/leaderboard?limit=5")
      .expect(200);

    expect(leaderboardResponse.body).toMatchObject({
      success: true,
      ok: true,
      source: "fallback",
    });

    expect(
      leaderboardResponse.body.scores.some(
        (score) => score.playerName === "API Tester",
      ),
    ).toBe(true);
  });

  it("should allow protected routes without an API key when protection is disabled", async () => {
    delete process.env.MEANING_BRIDGE_REQUIRE_API_KEY;
    delete process.env.MEANING_BRIDGE_API_KEY;

    const response = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .send({
        mode: "word-to-synonym",
        difficulty: "easy",
        pairCount: 4,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      ok: true,
    });
  });

  it("should reject protected routes when API key protection is enabled and the key is missing", async () => {
    process.env.MEANING_BRIDGE_REQUIRE_API_KEY = "true";
    process.env.MEANING_BRIDGE_API_KEY = "test-secret-key";

    const response = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .send({
        mode: "word-to-synonym",
        difficulty: "easy",
        pairCount: 4,
      })
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      ok: false,
      error: "Meaning Bridge API key is required.",
    });
  });

  it("should reject protected routes when API key protection is enabled and the key is invalid", async () => {
    process.env.MEANING_BRIDGE_REQUIRE_API_KEY = "true";
    process.env.MEANING_BRIDGE_API_KEY = "test-secret-key";

    const response = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .set(API_KEY_HEADER, "wrong-key")
      .send({
        mode: "word-to-synonym",
        difficulty: "easy",
        pairCount: 4,
      })
      .expect(403);

    expect(response.body).toEqual({
      success: false,
      ok: false,
      error: "Invalid Meaning Bridge API key.",
    });
  });

  it("should allow protected routes when API key protection is enabled and the key is valid", async () => {
    process.env.MEANING_BRIDGE_REQUIRE_API_KEY = "true";
    process.env.MEANING_BRIDGE_API_KEY = "test-secret-key";

    const response = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .set(API_KEY_HEADER, "test-secret-key")
      .send({
        mode: "word-to-synonym",
        difficulty: "easy",
        pairCount: 4,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      ok: true,
    });

    expect(response.body.puzzle.gameId).toBe("meaning_bridge");
  });

  it("should keep the health route open even when API key protection is enabled", async () => {
    process.env.MEANING_BRIDGE_REQUIRE_API_KEY = "true";
    process.env.MEANING_BRIDGE_API_KEY = "test-secret-key";

    const response = await request(app)
      .get("/api/v1/meaningBridge/health")
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      ok: true,
      game: "meaning_bridge",
      status: "ready",
    });
  });
});
