jest.mock("../raw-data-connect/retrieveTokenizedStoryById", () => ({
  retrieveStoryById: jest.fn(),
}));

const { initializeGame } = require("./controller/fillinblankscontroller");
const {
  retrieveStoryById,
} = require("../raw-data-connect/retrieveTokenizedStoryById");

afterEach(() => {
  jest.clearAllMocks();
});

describe("Fill in the Blank Controller Tests", () => {
  it("should return 200 and game data successfully", async () => {
    retrieveStoryById.mockResolvedValue({
      _id: "story123",
      englishVersion: "The cat runs fast.",
      tokenized_english_version: [
        { text: "The", pos: "DET" },
        { text: "cat", pos: "NOUN" },
        { text: "runs", pos: "VERB" },
        { text: "fast", pos: "ADJECTIVE" },
      ],
    });

    const req = {
      query: {
        storyId: "story123",
        difficulty: "easy",
        wordTypes: "NOUN",
        language: "english",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await initializeGame(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: "story123",
          originalParagraph: "The cat runs fast.",
          paragraph: expect.any(String),
          answers: expect.any(Array),
          wordBank: expect.any(Array),
        }),
      }),
    );
  });

  it("should return 400 when storyId is missing", async () => {
    const req = { query: { difficulty: "easy" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await initializeGame(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(retrieveStoryById).not.toHaveBeenCalled();
  });

  it("should return 500 when retrieveStoryById throws an error", async () => {
    retrieveStoryById.mockRejectedValue(new Error("Database error"));

    const req = {
      query: { storyId: "story123" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await initializeGame(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error",
    });
  });
});
