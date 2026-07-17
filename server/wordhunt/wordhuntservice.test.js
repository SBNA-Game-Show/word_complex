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
const StoryInfo = require("./models/StoryInfo");
const GameData = require("./models/GameData");

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
    it("should initialize the Word Hunt repository successfully", async () => {
      const storyIds = ["story1", "story2"];
      const gameId = "game123";

      const mockResponse = {
        success: true,
        message: "Word Hunt Repository Initialized Successfully",
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
  describe("insertStroyInfo Tests", () => {
    it("should initialize story information successfully", async () => {
      const gameId = "game123";
      const storyId = "story123";

      const storyInfo = new StoryInfo(5, 1, 3, 1, 2, 1);

      initializeStoryInfo.mockResolvedValue(
        "Story Information Already Initialized",
      );

      const response = await insertStroyInfo(gameId, storyId, storyInfo);

      expect(initializeStoryInfo).toHaveBeenCalledTimes(1);

      expect(initializeStoryInfo).toHaveBeenCalledWith(
        gameId,
        storyId,
        storyInfo,
      );

      expect(response).toEqual({
        success: true,
        message: "Story Info Registered Successfully",
      });
    });

    it("should return failure response when repository returns null", async () => {
      const storyInfo = new StoryInfo(5, 1, 3, 1, 2, 1);

      initializeStoryInfo.mockResolvedValue(null);

      const response = await insertStroyInfo("game123", "story123", storyInfo);

      expect(initializeStoryInfo).toHaveBeenCalled();

      expect(response).toEqual({
        success: false,
        message: "Unable to Insert Stroy Info",
      });
    });

    it("should throw error when gameId is missing", async () => {
      const storyInfo = new StoryInfo(5, 1, 3, 1, 2, 1);

      await expect(
        insertStroyInfo(null, "story123", storyInfo),
      ).rejects.toThrow("Game Id is Required");

      expect(initializeStoryInfo).not.toHaveBeenCalled();
    });

    it("should throw error when storyId is missing", async () => {
      const storyInfo = new StoryInfo(5, 1, 3, 1, 2, 1);

      await expect(insertStroyInfo("game123", null, storyInfo)).rejects.toThrow(
        "Story Id is Required",
      );

      expect(initializeStoryInfo).not.toHaveBeenCalled();
    });

    it("should throw error when incorrect story information is passed", async () => {
      const invalidStoryInfo = {
        nounCount: 5,
        verbCount: 3,
        adjCount: 2,
      };

      await expect(
        insertStroyInfo("game123", "story123", invalidStoryInfo),
      ).rejects.toThrow("Incorrect Story Information Passed");

      expect(initializeStoryInfo).not.toHaveBeenCalled();
    });

    it("should propagate repository errors", async () => {
      const storyInfo = new StoryInfo(5, 1, 3, 1, 2, 1);

      initializeStoryInfo.mockRejectedValue(new Error("Database Failure"));

      await expect(
        insertStroyInfo("game123", "story123", storyInfo),
      ).rejects.toThrow("Database Failure");

      expect(initializeStoryInfo).toHaveBeenCalledWith(
        "game123",
        "story123",
        storyInfo,
      );
    });

    it("should reject undefined gameId", async () => {
      const storyInfo = new StoryInfo(5, 1, 3, 1, 2, 1);

      await expect(
        insertStroyInfo(undefined, "story123", storyInfo),
      ).rejects.toThrow("Game Id is Required");

      expect(initializeStoryInfo).not.toHaveBeenCalled();
    });

    it("should reject undefined storyId", async () => {
      const storyInfo = new StoryInfo(5, 1, 3, 1, 2, 1);

      await expect(
        insertStroyInfo("game123", undefined, storyInfo),
      ).rejects.toThrow("Story Id is Required");

      expect(initializeStoryInfo).not.toHaveBeenCalled();
    });
  });
  describe("insertGameData Tests", () => {
    it("should insert game data successfully", async () => {
      const gameId = "game123";
      const storyId = "story123";
      const playerId = "player123";
      const playerName = "Jack";

      const gameData = new GameData("0:30", 2, 10, 1, 5);

      const mockResponse = {
        success: true,
        message: "Game Data registered successfully",
      };

      registerGameData.mockResolvedValue(mockResponse);

      const response = await insertGameData(
        gameId,
        storyId,
        playerId,
        playerName,
        gameData,
        "Noun",
      );

      expect(registerGameData).toHaveBeenCalledTimes(1);

      expect(registerGameData).toHaveBeenCalledWith(
        gameId,
        storyId,
        playerId,
        playerName,
        gameData,
        "Noun",
      );

      expect(response).toEqual(mockResponse);
    });

    it("should throw error when gameId is missing", async () => {
      const gameData = new GameData("0:30", 2, 10, 1, 5);

      await expect(
        insertGameData(null, "story123", "player123", "Jack", gameData, "Noun"),
      ).rejects.toThrow("Game Id is Required");

      expect(registerGameData).not.toHaveBeenCalled();
    });

    it("should throw error when storyId is missing", async () => {
      const gameData = new GameData("0:30", 2, 10, 1, 5);

      await expect(
        insertGameData("game123", null, "player123", "Jack", gameData, "Noun"),
      ).rejects.toThrow("Story Id is Required");

      expect(registerGameData).not.toHaveBeenCalled();
    });

    it("should throw error when playerId is missing", async () => {
      const gameData = new GameData("0:30", 2, 10, 1, 5);

      await expect(
        insertGameData("game123", "story123", null, "Jack", gameData, "Noun"),
      ).rejects.toThrow("Player Id is Required");

      expect(registerGameData).not.toHaveBeenCalled();
    });

    it("should throw error when playerName is missing", async () => {
      const gameData = new GameData("0:30", 2, 10, 1, 5);

      await expect(
        insertGameData(
          "game123",
          "story123",
          "player123",
          null,
          gameData,
          "Noun",
        ),
      ).rejects.toThrow("Player Name is Required");

      expect(registerGameData).not.toHaveBeenCalled();
    });

    it("should throw error when invalid GameData is passed", async () => {
      const invalidGameData = {
        bestTime: "0:30",
        coins: 2,
        totalScore: 10,
      };

      await expect(
        insertGameData(
          "game123",
          "story123",
          "player123",
          "Jack",
          invalidGameData,
          "Noun",
        ),
      ).rejects.toThrow("Invalid Game Data Passed");

      expect(registerGameData).not.toHaveBeenCalled();
    });

    it("should reject undefined values", async () => {
      const gameData = new GameData("0:30", 2, 10, 1, 5);

      await expect(
        insertGameData(
          undefined,
          "story123",
          "player123",
          "Jack",
          gameData,
          "Noun",
        ),
      ).rejects.toThrow("Game Id is Required");
    });

    it("should propagate repository errors", async () => {
      const gameData = new GameData("0:30", 2, 10, 1, 5);

      registerGameData.mockRejectedValue(new Error("Database Failure"));

      await expect(
        insertGameData(
          "game123",
          "story123",
          "player123",
          "Jack",
          gameData,
          "Noun",
        ),
      ).rejects.toThrow("Database Failure");

      expect(registerGameData).toHaveBeenCalledWith(
        "game123",
        "story123",
        "player123",
        "Jack",
        gameData,
        "Noun",
      );
    });

    it("should call registerGameData only once", async () => {
      const gameData = new GameData("0:30", 2, 10, 1, 5);

      registerGameData.mockResolvedValue({});

      await insertGameData(
        "game123",
        "story123",
        "player123",
        "Jack",
        gameData,
        "Verb",
      );

      expect(registerGameData).toHaveBeenCalledTimes(1);
    });
  });
  describe("getPlayerInfoByStory Tests", () => {
    it("should return player information successfully", async () => {
      const mockResponse = {
        nounWords: 5,
        verbWords: 3,
        adjWords: 2,

        gameInfo: [
          {
            playerName: "Jack",
            totalCoins: 10,
            totalScore: 50,

            games: {
              Noun: {
                history: [
                  {
                    bestTime: "0:20",
                    coins: 2,
                    totalScore: 10,
                    foundWords: 5,
                  },
                ],
              },

              Verb: {
                history: [
                  {
                    bestTime: "0:15",
                    coins: 2,
                    totalScore: 10,
                    foundWords: 3,
                  },
                ],
              },

              Adjective: {
                history: [
                  {
                    bestTime: "0:10",
                    coins: 2,
                    totalScore: 10,
                    foundWords: 2,
                  },
                ],
              },
            },
          },
        ],
      };

      retrievePlayerInfoByStory.mockResolvedValue(mockResponse);

      const response = await getPlayerInfoByStory(
        "game123",
        "story123",
        "Jack",
      );

      expect(retrievePlayerInfoByStory).toHaveBeenCalledTimes(1);

      expect(retrievePlayerInfoByStory).toHaveBeenCalledWith(
        "game123",
        "story123",
      );

      expect(response).toEqual({
        storyId: "story123",
        earnedCoins: 10,
        earnedScore: 50,

        games: {
          Noun: expect.any(Object),
          Verb: expect.any(Object),
          Adjective: expect.any(Object),
        },
      });
    });

    it("should return default values when player does not exist", async () => {
      retrievePlayerInfoByStory.mockResolvedValue({
        nounWords: 5,
        verbWords: 3,
        adjWords: 2,

        gameInfo: [
          {
            playerName: "Jane",
            totalCoins: 5,
            totalScore: 20,
          },
        ],
      });

      const response = await getPlayerInfoByStory(
        "game123",
        "story123",
        "Jack",
      );

      expect(response).toEqual({
        storyId: "story123",
        earnedCoins: 0,
        earnedScore: 0,
        games: {
          Noun: null,
          Verb: null,
          Adjective: null,
        },
      });
    });

    it("should throw error when gameId is missing", async () => {
      await expect(
        getPlayerInfoByStory(null, "story123", "Jack"),
      ).rejects.toThrow("Game Id is Required");

      expect(retrievePlayerInfoByStory).not.toHaveBeenCalled();
    });

    it("should throw error when storyId is missing", async () => {
      await expect(
        getPlayerInfoByStory("game123", null, "Jack"),
      ).rejects.toThrow("Story Id is Required");

      expect(retrievePlayerInfoByStory).not.toHaveBeenCalled();
    });

    it("should throw error when playerName is missing", async () => {
      await expect(
        getPlayerInfoByStory("game123", "story123", null),
      ).rejects.toThrow("Player Id is Required");

      expect(retrievePlayerInfoByStory).not.toHaveBeenCalled();
    });

    it("should handle missing gameInfo and return defaults", async () => {
      retrievePlayerInfoByStory.mockResolvedValue({
        nounWords: 5,
        verbWords: 3,
        adjWords: 2,
      });

      const response = await getPlayerInfoByStory(
        "game123",
        "story123",
        "Jack",
      );

      expect(response).toEqual({
        storyId: "story123",
        earnedCoins: 0,
        earnedScore: 0,
        games: {
          Noun: null,
          Verb: null,
          Adjective: null,
        },
      });
    });

    it("should handle missing player game history", async () => {
      retrievePlayerInfoByStory.mockResolvedValue({
        nounWords: 5,
        verbWords: 3,
        adjWords: 2,

        gameInfo: [
          {
            playerName: "Jack",
            totalCoins: 5,
            totalScore: 10,
            games: {},
          },
        ],
      });

      const response = await getPlayerInfoByStory(
        "game123",
        "story123",
        "Jack",
      );

      expect(response.games.Noun).toBeNull();
      expect(response.games.Verb).toBeNull();
      expect(response.games.Adjective).toBeNull();
    });

    it("should propagate repository errors", async () => {
      retrievePlayerInfoByStory.mockRejectedValue(
        new Error("Database Failure"),
      );

      await expect(
        getPlayerInfoByStory("game123", "story123", "Jack"),
      ).rejects.toThrow("Database Failure");

      expect(retrievePlayerInfoByStory).toHaveBeenCalledWith(
        "game123",
        "story123",
      );
    });

    it("should only call repository once", async () => {
      retrievePlayerInfoByStory.mockResolvedValue({
        gameInfo: [],
      });

      await getPlayerInfoByStory("game123", "story123", "Jack");

      expect(retrievePlayerInfoByStory).toHaveBeenCalledTimes(1);
    });
  });
});
