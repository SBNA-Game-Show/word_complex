const request = require("supertest");

jest.mock("../raw-data-connect/retrieveTokenizedStoryById", () => ({
  retrieveStoryById: jest.fn(),
  retrieveRandomStory: jest.fn(),
}));

const { retrieveStoryById } = require("../raw-data-connect/retrieveTokenizedStoryById");
const app = require("../app");

const MOCK_STORY = {
  _id: "292f2009-96bb-4a3c-b856-e04214e852f8",
  title: { englishversion: "Mock Meaning Bridge Story" },
  category: "Test Story",
  englishVersion:
    "A bright rabbit moved quickly through the calm forest toward a happy village.",
  tokenized_english_version: [
    { text: "bright",  pos: "ADJ",  synonyms: ["smart",      "clever"], antonyms: ["dark"]        },
    { text: "quickly", pos: "ADV",  synonyms: ["rapidly",    "swiftly"], antonyms: ["slowly"]     },
    { text: "calm",    pos: "ADJ",  synonyms: ["peaceful",   "quiet"],   antonyms: ["angry"]      },
    { text: "happy",   pos: "ADJ",  synonyms: ["joyful",     "glad"],    antonyms: ["sad"]        },
    { text: "village", pos: "NOUN", synonyms: ["settlement", "town"],    antonyms: ["wilderness"] },
  ],
  sanskritVersion: [],
  transliteratedVersion: [],
  tokenized_sanskrit_version: [],
};

describe("Meaning Bridge API routes", () => {
  beforeEach(() => {
    retrieveStoryById.mockResolvedValue(MOCK_STORY);
  });

  it("should expose a health endpoint", async () => {
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

  it("should generate a puzzle round", async () => {
    const response = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .send({ mode: "word-to-synonym", pairCount: 4, storyId: MOCK_STORY._id })
      .expect(200);

    expect(response.body).toMatchObject({ success: true, ok: true });
    expect(response.body.puzzle.gameId).toBe("meaning_bridge");
    expect(response.body.puzzle.roundId).toMatch(/^round_/);
    expect(response.body.puzzle.leftItems).toHaveLength(4);
    expect(response.body.puzzle.rightItems).toHaveLength(4);
    expect(Object.keys(response.body.puzzle.answerKey)).toHaveLength(4);
    expect(response.body.passage.title).toBeTruthy();
  });

  it("should reject a missing storyId", async () => {
    const response = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .send({ mode: "word-to-synonym", pairCount: 4 })
      .expect(400);

    expect(response.body).toMatchObject({ success: false, ok: false });
  });

  it("should reject an unsupported mode", async () => {
    const response = await request(app)
      .post("/api/v1/meaningBridge/generate")
      .send({ mode: "not-a-real-mode", pairCount: 4 })
      .expect(400);

    expect(response.body).toMatchObject({ success: false, ok: false });
  });

  describe("score submission", () => {
    const MATCHES_4 = [
      { leftId: "l1", rightId: "r1" },
      { leftId: "l2", rightId: "r2" },
      { leftId: "l3", rightId: "r3" },
      { leftId: "l4", rightId: "r4" },
    ];

    it("adds a speed bonus for a fast round", async () => {
      // base = 4*10 - 1*2 - 2*5 = 28; bonus = (90-30)*0.5 = 30 -> 58
      const response = await request(app)
        .post("/api/v1/meaningBridge/submit")
        .send({
          roundId: "round_fast_1",
          playerName: "SpeedTester",
          matches: MATCHES_4,
          timeSeconds: 30,
          hintsUsed: 1,
          wrongAttempts: 2,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        ok: true,
        baseScore: 28,
        speedBonus: 30,
        score: 58,
      });
    });

    it("gives no speed bonus at or beyond the time limit", async () => {
      // base = 4*10 = 40; timeSeconds 120 >= 90 -> bonus 0
      const response = await request(app)
        .post("/api/v1/meaningBridge/submit")
        .send({
          roundId: "round_slow_1",
          playerName: "SlowTester",
          matches: MATCHES_4,
          timeSeconds: 120,
          hintsUsed: 0,
          wrongAttempts: 0,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        baseScore: 40,
        speedBonus: 0,
        score: 40,
      });
    });

    it("gives no speed bonus when nothing was matched", async () => {
      // An instant empty submit must not farm bonus points.
      const response = await request(app)
        .post("/api/v1/meaningBridge/submit")
        .send({
          roundId: "round_empty_1",
          playerName: "EmptyTester",
          matches: [],
          timeSeconds: 1,
          hintsUsed: 0,
          wrongAttempts: 0,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        baseScore: 0,
        speedBonus: 0,
        score: 0,
      });
    });

    it("ignores a duplicate submission of the same round", async () => {
      const payload = {
        roundId: "round_dup_1",
        playerName: "DupTester",
        matches: MATCHES_4,
        timeSeconds: 30,
        hintsUsed: 0,
        wrongAttempts: 0,
      };

      await request(app).post("/api/v1/meaningBridge/submit").send(payload);
      const second = await request(app)
        .post("/api/v1/meaningBridge/submit")
        .send(payload)
        .expect(200);

      expect(second.body).toMatchObject({ success: true, duplicate: true });
      expect(second.body.score).toBeUndefined();
    });

    it("accumulates scores across rounds and caps the leaderboard list", async () => {
      const board = await request(app)
        .get("/api/v1/meaningBridge/leaderboard?limit=500")
        .expect(200);

      expect(board.body.success).toBe(true);
      expect(Array.isArray(board.body.scores)).toBe(true);
      expect(board.body.scores.length).toBeLessThanOrEqual(20);

      const speedTester = board.body.scores.find(
        (row) => row.playerName === "SpeedTester",
      );
      expect(speedTester).toBeTruthy();
      expect(speedTester.totalScore).toBe(58);
    });
  });
});
