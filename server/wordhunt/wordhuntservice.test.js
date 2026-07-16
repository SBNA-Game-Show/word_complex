const findNounVerbAndAdjEnglish = require("./service/findNounsVerbsAndAdjectivesGameEnglish");
const findNounVerbAndAdjSanskrit = require("./service/findNounsVerbsAndAdjectivesGameSanskrit");
const {
  retrieveStoryById,
} = require("../raw-data-connect/retrieveTokenizedStoryById");
const {
  initWordHuntRepo,
  retrieveAllMetaData,
  insertStroyInfo,
  insertGameData,
  getPlayerInfoByStory,
} = require("./service/gameservice");

const {
  initializeGame,
  getAllGameInfo,
  initializeStoryInfo,
  registerGameData,
  retrievePlayerInfoByStory,
} = require("./repository/wordhuntrepo");

jest.mock("../raw-data-connect/retrieveTokenizedStoryById");
jest.mock("./repository/wordhuntrepo", () => ({
  initializeGame: jest.fn(),
  getAllGameInfo: jest.fn(),
  initializeStoryInfo: jest.fn(),
  registerGameData: jest.fn(),
  retrievePlayerInfoByStory: jest.fn(),
}));

beforeAll(async () => {});

afterEach(async () => {
  jest.clearAllMocks();
});

afterAll(async () => {});

describe("Find Nouns Verbs and Adjectives Game English Tests. Service Layer", () => {
  it("Should successfully process and return cleaned Data. Success Scenario", async () => {
    retrieveStoryById.mockResolvedValue({
      englishVersion: "My cat Meows.",
      tokenized_english_version: [
        {
          word: "My",
          pos: "DET",
          synonyms: ["A"],
          antonyms: [],
        },
        {
          word: "cat",
          pos: "NOUN",
          synonyms: ["feline"],
          antonyms: [],
        },
        {
          word: "Meows",
          pos: "VERB",
          synonyms: ["jogs"],
          antonyms: ["walks"],
        },
      ],
    });

    const result = await findNounVerbAndAdjEnglish("123");

    expect(result).toEqual({
      passage: "My cat Meows.",
      passageArray: ["My", "cat", "Meows", "."],
      tokenizedPassage: [
        {
          word: "My",
          pos: "DET",
        },
        {
          word: "cat",
          pos: "NOUN",
        },
        {
          word: "Meows",
          pos: "VERB",
        },
      ],
    });

    expect(retrieveStoryById).toHaveBeenCalledWith("123");
  });

  it("should throw when Story Id is missing", async () => {
    await expect(findNounVerbAndAdjEnglish("")).rejects.toThrow(
      "Story Id is missing",
    );

    expect(retrieveStoryById).not.toHaveBeenCalled();
  });

  it("should not return a tokenized story. No Story Found By Given Id", async () => {
    retrieveStoryById.mockResolvedValue(null);
    const storyId = "xyz";

    await expect(findNounVerbAndAdjEnglish(storyId)).rejects.toThrow(
      "Story data not found",
    );
  });

  it("should not return a tokenized story. Passage is missing", async () => {
    retrieveStoryById.mockResolvedValue({
      englishVersion: "",
      tokenized_english_version: [
        {
          word: "My",
          pos: "DET",
          synonyms: ["A"],
          antonyms: [],
        },
        {
          word: "cat",
          pos: "NOUN",
          synonyms: ["feline"],
          antonyms: [],
        },
        {
          word: "Meows",
          pos: "VERB",
          synonyms: ["jogs"],
          antonyms: ["walks"],
        },
      ],
    });

    await expect(findNounVerbAndAdjEnglish("123")).rejects.toThrow(
      "Passage is missing for changing to an array",
    );
  });

  it("should not return a tokenized story. Tokenized Array Missing", async () => {
    retrieveStoryById.mockResolvedValue({
      englishVersion: "My cat Meows.",
      tokenized_english_version: [],
    });

    await expect(findNounVerbAndAdjEnglish("123")).rejects.toThrow(
      "Tokenized Passage not Available",
    );

    expect(retrieveStoryById).toHaveBeenCalledWith("123");
  });
});

describe("Find Nouns Verbs and Adjectives Game Sanskrit Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should successfully return Sanskrit passage and tokenized passage", async () => {
    retrieveStoryById.mockResolvedValue({
      sanskritVersion: ["शशकः नकुलः मार्जारी च"],
      tokenized_sanskrit_version: [
        {
          text: "शशकः",
          lemma: "शशकः",
          upos: "NOUN",
        },
        {
          text: "नकुलः",
          lemma: "नकुलः",
          upos: "NOUN",
        },
        {
          text: "मार्जारी",
          lemma: "मार्जारी",
          upos: "ADJ",
        },
      ],
    });

    const result = await findNounVerbAndAdjSanskrit("123");

    expect(result).toEqual({
      passage: ["शशकः नकुलः मार्जारी च"],
      tokenizedPassage: [
        {
          text: "शशकः",
          lemma: "शशकः",
          upos: "NOUN",
        },
        {
          text: "नकुलः",
          lemma: "नकुलः",
          upos: "NOUN",
        },
        {
          text: "मार्जारी",
          lemma: "मार्जारी",
          upos: "ADJ",
        },
      ],
    });

    expect(retrieveStoryById).toHaveBeenCalledTimes(1);
    expect(retrieveStoryById).toHaveBeenCalledWith("123");
  });

  it("Should throw error when story id is missing", async () => {
    await expect(findNounVerbAndAdjSanskrit("")).rejects.toThrow(
      "Story Id is missing",
    );

    expect(retrieveStoryById).not.toHaveBeenCalled();
  });

  it("Should throw error when story id is undefined", async () => {
    await expect(findNounVerbAndAdjSanskrit()).rejects.toThrow(
      "Story Id is missing",
    );

    expect(retrieveStoryById).not.toHaveBeenCalled();
  });

  it("Should throw error when story id is null", async () => {
    await expect(findNounVerbAndAdjSanskrit(null)).rejects.toThrow(
      "Story Id is missing",
    );

    expect(retrieveStoryById).not.toHaveBeenCalled();
  });

  it("Should throw error when story data is not found", async () => {
    retrieveStoryById.mockResolvedValue(null);

    await expect(findNounVerbAndAdjSanskrit("123")).rejects.toThrow(
      "Story data not found",
    );

    expect(retrieveStoryById).toHaveBeenCalledWith("123");
  });

  it("Should throw error when Sanskrit passage is missing", async () => {
    retrieveStoryById.mockResolvedValue({
      sanskritVersion: [],
      tokenized_sanskrit_version: [
        {
          text: "शशकः",
          lemma: "शशकः",
          upos: "NOUN",
        },
      ],
    });

    await expect(findNounVerbAndAdjSanskrit("123")).rejects.toThrow(
      "Sanskrit passage not found",
    );
  });

  it("Should throw error when Sanskrit passage is not an array", async () => {
    retrieveStoryById.mockResolvedValue({
      sanskritVersion: "शशकः",
      tokenized_sanskrit_version: [
        {
          text: "शशकः",
          lemma: "शशकः",
          upos: "NOUN",
        },
      ],
    });

    await expect(findNounVerbAndAdjSanskrit("123")).rejects.toThrow(
      "Sanskrit passage not found",
    );
  });

  it("Should throw error when tokenized Sanskrit passage is missing", async () => {
    retrieveStoryById.mockResolvedValue({
      sanskritVersion: ["शशकः नकुलः मार्जारी च"],
      tokenized_sanskrit_version: [],
    });

    await expect(findNounVerbAndAdjSanskrit("123")).rejects.toThrow(
      "Tokenized Sanskrit passage not found",
    );
  });

  it("Should throw error when tokenized Sanskrit passage is not an array", async () => {
    retrieveStoryById.mockResolvedValue({
      sanskritVersion: ["शशकः नकुलः मार्जारी च"],
      tokenized_sanskrit_version: "invalid",
    });

    await expect(findNounVerbAndAdjSanskrit("123")).rejects.toThrow(
      "Tokenized Sanskrit passage not found",
    );
  });

  it("Should propagate repository errors", async () => {
    retrieveStoryById.mockRejectedValue(new Error("Database failure"));

    await expect(findNounVerbAndAdjSanskrit("123")).rejects.toThrow(
      "Database failure",
    );
  });

  it("Should not call repository more than once", async () => {
    retrieveStoryById.mockResolvedValue({
      sanskritVersion: ["शशकः"],
      tokenized_sanskrit_version: [
        {
          text: "शशकः",
          lemma: "शशकः",
          upos: "NOUN",
        },
      ],
    });

    await findNounVerbAndAdjSanskrit("123");

    expect(retrieveStoryById).toHaveBeenCalledTimes(1);
  });
});

describe("Game Service Tests", () => {
  describe("initWordHuntRepo Tests", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should initialize the Word Hunt repository successfully", async () => {
      const storyIds = ["story1", "story2"];
      const gameId = "game123";

      const mockResponse = {
        _id: gameId,
        stories: storyIds,
      };

      initializeGame.mockResolvedValue(mockResponse);

      const response = await initWordHuntRepo(storyIds, gameId);

      expect(initializeGame).toHaveBeenCalledTimes(1);
      expect(initializeGame).toHaveBeenCalledWith(storyIds, gameId);
      expect(response).toEqual(mockResponse);
    });

    it("should throw when storyIds is not an array", async () => {
      await expect(initWordHuntRepo("story1", "game123")).rejects.toThrow(
        "Story ID's Must be Passed as an Array. To Initialize Word Hunt DB",
      );

      expect(initializeGame).not.toHaveBeenCalled();
    });

    it("should throw when storyIds array is empty", async () => {
      await expect(initWordHuntRepo([], "game123")).rejects.toThrow(
        "No Story Id is Passed. To Initialize Word Hunt DB",
      );

      expect(initializeGame).not.toHaveBeenCalled();
    });

    it("should throw when gameId is missing", async () => {
      await expect(initWordHuntRepo(["story1"], "")).rejects.toThrow(
        "Game Id is required",
      );

      expect(initializeGame).not.toHaveBeenCalled();
    });

    it("should throw when gameId is undefined", async () => {
      await expect(initWordHuntRepo(["story1"])).rejects.toThrow(
        "Game Id is required",
      );

      expect(initializeGame).not.toHaveBeenCalled();
    });

    it("should propagate repository errors", async () => {
      initializeGame.mockRejectedValue(new Error("Database Error"));

      await expect(initWordHuntRepo(["story1"], "game123")).rejects.toThrow(
        "Database Error",
      );

      expect(initializeGame).toHaveBeenCalledWith(["story1"], "game123");
    });

    it("should only call initializeGame once", async () => {
      initializeGame.mockResolvedValue({
        _id: "game123",
      });

      await initWordHuntRepo(["story1"], "game123");

      expect(initializeGame).toHaveBeenCalledTimes(1);
    });
  });
  describe("retrieveAllMetaData Tests", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should retrieve all game metadata successfully", async () => {
      const mockGames = [
        {
          _id: "game123",
          stories: [
            {
              storyId: "story1",
            },
          ],
        },
        {
          _id: "game456",
          stories: [
            {
              storyId: "story2",
            },
          ],
        },
      ];

      getAllGameInfo.mockResolvedValue(mockGames);

      const response = await retrieveAllMetaData();

      expect(getAllGameInfo).toHaveBeenCalledTimes(1);
      expect(response).toEqual(mockGames);
    });

    it("should return empty array when no games exist", async () => {
      getAllGameInfo.mockResolvedValue([]);

      const response = await retrieveAllMetaData();

      expect(getAllGameInfo).toHaveBeenCalledTimes(1);
      expect(response).toEqual([]);
    });

    it("should propagate repository errors", async () => {
      getAllGameInfo.mockRejectedValue(new Error("Database connection failed"));

      await expect(retrieveAllMetaData()).rejects.toThrow(
        "Database connection failed",
      );

      expect(getAllGameInfo).toHaveBeenCalledTimes(1);
    });

    it("should call repository only once", async () => {
      getAllGameInfo.mockResolvedValue({
        games: [],
      });

      await retrieveAllMetaData();

      expect(getAllGameInfo).toHaveBeenCalledTimes(1);
    });
  });
});
