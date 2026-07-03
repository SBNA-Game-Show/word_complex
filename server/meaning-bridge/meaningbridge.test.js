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
});
