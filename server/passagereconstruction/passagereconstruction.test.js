const request = require("supertest");
const app = require("../app");

const { retrieveStoryById } = require("../raw-data-connect/retrieveTokenizedStoryById");

const {
  getPassageReconstructionGame,
  extractPassageData,
  splitIntoSentences,
  buildChunks,
  buildReconstructionRounds,
} = require("./service/passageReconstructionService");

jest.mock("../raw-data-connect/retrieveTokenizedStoryById");

afterEach(() => {
  jest.clearAllMocks();
});

const mockStory = {
  englishVersion:
    "The rabbit left his home. A weasel moved in and refused to leave. A great dispute arose over this.",
  sanskritVersion: [
    "कश्चित् शशकः स्वगृहं त्यक्तवान्।",
    "कश्चित् नकुलः तत्र प्रविश्य निवासम् अकरोत्।",
    "ततः तयोः महान् विवादः अभवत्।",
  ],
};

//Service Layer

describe("Passage Reconstruction Service", () => {
  describe("extractPassageData", () => {
    it("returns the passage from a valid story", () => {
      const result = extractPassageData(mockStory);
      expect(result).toEqual({ passage: mockStory.englishVersion });
    });

    it("returns Sanskrit sentences from a valid story", () => {
      const result = extractPassageData(mockStory, "sanskrit");
      expect(result).toEqual({ passage: mockStory.sanskritVersion });
    });

    it("throws when story is null", () => {
      expect(() => extractPassageData(null)).toThrow("Story data not found");
    });

    it("throws when language is unsupported", () => {
      expect(() => extractPassageData(mockStory, "french")).toThrow(
        "Unsupported language: french"
      );
    });
  });

  describe("splitIntoSentences", () => {
    it("splits a passage into individual sentences", () => {
      const result = splitIntoSentences(mockStory.englishVersion);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe("The rabbit left his home.");
    });

    it("returns Sanskrit array sentences", () => {
      const result = splitIntoSentences(mockStory.sanskritVersion);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe("कश्चित् शशकः स्वगृहं त्यक्तवान्।");
    });

    it("splits Sanskrit strings on danda punctuation", () => {
      const result = splitIntoSentences(mockStory.sanskritVersion.join(" "));
      expect(result).toHaveLength(3);
      expect(result[2]).toBe("ततः तयोः महान् विवादः अभवत्।");
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

  describe("buildReconstructionRounds", () => {
    it("throws when fewer than three playable sentences are available", () => {
      expect(() =>
        buildReconstructionRounds([
          "One two three.",
          "Four five six.",
          "Seven eight nine.",
        ])
      ).toThrow("At least three playable sentences are required");
    });
  });

  describe("getPassageReconstructionGame", () => {
    it("returns passage and 3 rounds on success", async () => {
      retrieveStoryById.mockResolvedValue(mockStory);

      const result = await getPassageReconstructionGame("test-id");

      expect(result.passage).toBe(mockStory.englishVersion);
      expect(result.language).toBe("english");
      expect(result.rounds).toHaveLength(3);
      expect(result.rounds[0]).toHaveProperty("sentence");
      expect(result.rounds[0]).toHaveProperty("chunks");
      expect(result.rounds[0]).toHaveProperty("answer");
      expect(retrieveStoryById).toHaveBeenCalledWith("test-id");
    });

    it("returns Sanskrit passage and rounds on success", async () => {
      retrieveStoryById.mockResolvedValue(mockStory);

      const result = await getPassageReconstructionGame("test-id", "sanskrit");

      expect(result.passage).toEqual(mockStory.sanskritVersion);
      expect(result.language).toBe("sanskrit");
      expect(result.rounds).toHaveLength(3);
      expect(result.rounds[0].sentence).toBe(mockStory.sanskritVersion[0]);
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

    it("throws when selected-language passage is missing", async () => {
      retrieveStoryById.mockResolvedValue({ ...mockStory, sanskritVersion: [] });
      await expect(
        getPassageReconstructionGame("test-id", "sanskrit")
      ).rejects.toThrow("Passage is missing");
    });
  });
});

// Route + Controller

describe("Passage Reconstruction Route + Controller", () => {
  it("GET /api/v1/passageReconstruct/game returns 200 with passage and rounds", async () => {
    retrieveStoryById.mockResolvedValue(mockStory);

    const response = await request(app)
      .get("/api/v1/passageReconstruct/game")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.passage).toBe(mockStory.englishVersion);
    expect(response.body.data.language).toBe("english");
    expect(response.body.data.rounds).toHaveLength(3);
  });

  it("GET /api/v1/passageReconstruct/game?language=sanskrit returns Sanskrit rounds", async () => {
    retrieveStoryById.mockResolvedValue(mockStory);

    const response = await request(app)
      .get("/api/v1/passageReconstruct/game?language=sanskrit")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.passage).toEqual(mockStory.sanskritVersion);
    expect(response.body.data.language).toBe("sanskrit");
    expect(response.body.data.rounds).toHaveLength(3);
  });

  it("GET /api/v1/passageReconstruct/game returns 400 for an invalid language", async () => {
    const response = await request(app)
      .get("/api/v1/passageReconstruct/game?language=french")
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Unsupported language: french");
    expect(retrieveStoryById).not.toHaveBeenCalled();
  });

  it("GET /api/v1/passageReconstruct/game returns 500 when service throws", async () => {
    retrieveStoryById.mockRejectedValue(new Error("DB connection failed"));

    const response = await request(app)
      .get("/api/v1/passageReconstruct/game")
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("DB connection failed");
  });
});
