const { initializeGame } = require("./controller/fillinblankscontroller");
const retrieveStoryById = require("../raw-data-connect/retrieveTokenizedStoryById");

jest.mock("../raw-data-connect/retrieveTokenizedStoryById");

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
      })
    );

    expect(retrieveStoryById).toHaveBeenCalledWith(
      "292f2009-96bb-4a3c-b856-e04214e852f8"
    );
  });

  it("should return 500 when retrieveStoryById throws an error", async () => {
    retrieveStoryById.mockRejectedValue(new Error("Database error"));

    const req = {
      query: {},
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