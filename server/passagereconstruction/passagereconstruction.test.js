const request = require("supertest");
const app = require("../app");

const { retrieveStoryById } = require("../raw-data-connect/retrieveTokenizedStoryById");

const {
  getPassageReconstructionGame,
  extractPassageData,
  splitIntoSentences,
  buildChunks,
} = require("./service/passageReconstructionService");

jest.mock("../raw-data-connect/retrieveTokenizedStoryById");

afterEach(() => {
  jest.clearAllMocks();
});

const mockStory = {
  englishVersion:
    "The rabbit left his home. A weasel moved in and refused to leave. A great dispute arose over this.",
};

// ─── Service Layer ────────────────────────────────────────────────────────────

describe("Passage Reconstruction Service", () => {
  describe("extractPassageData", () => {
    it("returns the passage from a valid story", () => {
      const result = extractPassageData(mockStory);
      expect(result).toEqual({ passage: mockStory.englishVersion });
    });

    it("throws when story is null", () => {
      expect(() => extractPassageData(null)).toThrow("Story data not found");
    });
  });

  describe("splitIntoSentences", () => {
    it("splits a passage into individual sentences", () => {
      const result = splitIntoSentences(mockStory.englishVersion);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe("The rabbit left his home.");
    });

    it("throws when passage is missing", () => {
      expect(() => splitIntoSentences("")).toThrow("Passage is missing");
    });
  });

  describe("buildChunks", () => {
    it("always returns exactly 4 items in answer and chunks", () => {
      const result = buildChunks("The rabbit left his home alone today here.");
      expect(result.answer).toHaveLength(4);
      expect(result.chunks).toHaveLength(4);
    });

    it("chunks contain the same words as answer", () => {
      const result = buildChunks("The rabbit left his home alone today here.");
      expect(result.chunks.sort()).toEqual(result.answer.sort());
    });

    it("answer reconstructs the original sentence", () => {
      const sentence = "The rabbit left his home alone today here.";
      const result = buildChunks(sentence);
      expect(result.answer.join(" ")).toBe(sentence);
    });

    it("includes the original sentence", () => {
      const sentence = "The rabbit left his home alone today here.";
      const result = buildChunks(sentence);
      expect(result.sentence).toBe(sentence);
    });

    it("never returns chunks already in the answer order", () => {
      for (let i = 0; i < 100; i++) {
        const result = buildChunks("The rabbit left his home alone today here.");
        expect(result.chunks).not.toEqual(result.answer);
      }
    });
  });

  describe("getPassageReconstructionGame", () => {
    it("returns passage and 3 rounds on success", async () => {
      retrieveStoryById.mockResolvedValue(mockStory);

      const result = await getPassageReconstructionGame("test-id");

      expect(result.passage).toBe(mockStory.englishVersion);
      expect(result.rounds).toHaveLength(3);
      expect(result.rounds[0]).toHaveProperty("sentence");
      expect(result.rounds[0]).toHaveProperty("chunks");
      expect(result.rounds[0]).toHaveProperty("answer");
      expect(retrieveStoryById).toHaveBeenCalledWith("test-id");
    });

    it("throws when storyId is missing", async () => {
      await expect(getPassageReconstructionGame("")).rejects.toThrow(
        "Story Id is required"
      );
      expect(retrieveStoryById).not.toHaveBeenCalled();
    });

    it("throws when story is not found", async () => {
      retrieveStoryById.mockResolvedValue(null);
      await expect(getPassageReconstructionGame("test-id")).rejects.toThrow(
        "Story data not found"
      );
    });

    it("throws when passage is missing", async () => {
      retrieveStoryById.mockResolvedValue({ englishVersion: "" });
      await expect(getPassageReconstructionGame("test-id")).rejects.toThrow(
        "Passage is missing"
      );
    });
  });
});

// ─── Route + Controller ───────────────────────────────────────────────────────

describe("Passage Reconstruction Route + Controller", () => {
  it("GET /api/v1/passageReconstruct/game returns 200 with passage and rounds", async () => {
    retrieveStoryById.mockResolvedValue(mockStory);

    const response = await request(app)
      .get("/api/v1/passageReconstruct/game?storyId=test-id")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.passage).toBe(mockStory.englishVersion);
    expect(response.body.data.rounds).toHaveLength(3);
  });

  it("GET /api/v1/passageReconstruct/game returns 400 when storyId is missing", async () => {
    const response = await request(app)
      .get("/api/v1/passageReconstruct/game")
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(retrieveStoryById).not.toHaveBeenCalled();
  });

  it("GET /api/v1/passageReconstruct/game returns 500 when service throws", async () => {
    retrieveStoryById.mockRejectedValue(new Error("DB connection failed"));

    const response = await request(app)
      .get("/api/v1/passageReconstruct/game?storyId=test-id")
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("DB connection failed");
  });
});
