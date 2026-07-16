const WordHunt = require("./schema/WordHunt");
const {
  initializeGame,
  getAllGameInfo,
  initializeStoryInfo,
  registerGameData,
  retrievePlayerInfoByStory,
} = require("./wordhuntrepo");

jest.mock("./schema/WordHunt");

beforeEach(() => {
  jest.clearAllMocks();
});

const gameId = "421f22e3-c3f0-47c2-84e8-3942e882f0d2";

const stories = [
  "04e9ae48-5570-4cd0-8968-a2179353164b",
  "05e9ae48-5570-4cd0-8968-a2179353164c",
];

describe("initializeGame Tests", () => {
  it("should successfully Initialize Repository", async () => {
    const mockSave = jest.fn().mockResolvedValue({
      _id: gameId,
      stories: [
        {
          storyId: stories[0],
          gameInfo: [],
        },
        {
          storyId: stories[1],
          gameInfo: [],
        },
      ],
    });

    WordHunt.mockImplementation((data) => ({
      ...data,
      save: mockSave,
    }));

    const response = await initializeGame(stories, gameId);

    expect(WordHunt).toHaveBeenCalledWith({
      _id: gameId,
      stories: [
        {
          storyId: stories[0],
          gameInfo: [],
        },
        {
          storyId: stories[1],
          gameInfo: [],
        },
      ],
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(response._id).toBe(gameId);
  });

  it("should throw error when storyId is not an array", async () => {
    await expect(initializeGame(stories[0], gameId)).rejects.toThrow(
      "Story ID's Must be Passed as an Array. To Initialize Word Hunt DB",
    );

    expect(WordHunt).not.toHaveBeenCalled();
  });

  it("should throw error when storyId array is empty", async () => {
    await expect(initializeGame([], gameId)).rejects.toThrow(
      "No Story Id is Passed. To Initialize Word Hunt DB",
    );

    expect(WordHunt).not.toHaveBeenCalled();
  });

  it("should throw error when storyId exceeds maximum story limit", async () => {
    const maximumExceededStories = Array(5).fill(
      "04e9ae48-5570-4cd0-8968-a2179353164b",
    );

    await expect(
      initializeGame(maximumExceededStories, gameId),
    ).rejects.toThrow("Maximum Limit of Stories in a Game is 4");

    expect(WordHunt).not.toHaveBeenCalled();
  });

  it("should allow exactly maximum number of stories", async () => {
    const maximumStories = ["story-1", "story-2", "story-3", "story-4"];

    const mockSave = jest.fn().mockResolvedValue(true);

    WordHunt.mockImplementation(() => ({
      save: mockSave,
    }));

    const response = await initializeGame(maximumStories, gameId);

    expect(mockSave).toHaveBeenCalledTimes(1);

    expect(response).toBe(true);
  });

  it("should throw error when gameId is missing", async () => {
    await expect(initializeGame(stories, null)).rejects.toThrow(
      "Game Id is required. To Initialize Word Hunt DB",
    );
  });

  it("should throw error when gameId is undefined", async () => {
    await expect(initializeGame(stories)).rejects.toThrow(
      "Game Id is required. To Initialize Word Hunt DB",
    );
  });

  it("should create gameInfo array for every story", async () => {
    const mockSave = jest.fn().mockResolvedValue(true);

    WordHunt.mockImplementation((data) => {
      expect(data.stories).toEqual([
        {
          storyId: stories[0],
          gameInfo: [],
        },
        {
          storyId: stories[1],
          gameInfo: [],
        },
      ]);

      return {
        save: mockSave,
      };
    });

    await initializeGame(stories, gameId);

    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it("should throw database error when save fails", async () => {
    const mockSave = jest
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    WordHunt.mockImplementation(() => ({
      save: mockSave,
    }));

    await expect(initializeGame(stories, gameId)).rejects.toThrow(
      "Database connection failed",
    );
  });

  it("should initialize multiple stories correctly", async () => {
    const multipleStories = ["story-1", "story-2", "story-3"];

    const mockSave = jest.fn().mockResolvedValue(true);

    WordHunt.mockImplementation((data) => {
      expect(data.stories.length).toBe(3);

      return {
        save: mockSave,
      };
    });

    await initializeGame(multipleStories, gameId);

    expect(mockSave).toHaveBeenCalled();
  });
});

describe("getAllGameInfo Tests", () => {
  it("should return all game information successfully", async () => {
    const mockGames = [
      {
        _id: "game1",
        stories: [],
      },
      {
        _id: "game2",
        stories: [],
      },
    ];

    WordHunt.find.mockResolvedValue(mockGames);

    const response = await getAllGameInfo();

    expect(WordHunt.find).toHaveBeenCalledTimes(1);

    expect(response).toEqual(mockGames);
  });

  it("should return empty array when no games exist", async () => {
    WordHunt.find.mockResolvedValue([]);

    const response = await getAllGameInfo();

    expect(response).toEqual([]);

    expect(WordHunt.find).toHaveBeenCalled();
  });

  it("should throw error when database retrieval fails", async () => {
    WordHunt.find.mockRejectedValue(new Error("Database connection failed"));

    await expect(getAllGameInfo()).rejects.toThrow(
      "Database connection failed",
    );
  });
});

describe("initializeStoryInfo Tests", () => {
  it("should initialize story info and save successfully", async () => {
    const storyInfo = {
      nounCount: 5,
      nounHint: 1,
      verbCount: 3,
      verbHint: 1,
      adjCount: 2,
      adjHint: 1,
    };

    const mockStory = {
      storyId: "story123",
    };

    const mockResponse = {
      message: "Story Info Initialized",
    };

    const mockGame = {
      stories: [mockStory],
      initializeStoryInfo: jest.fn().mockReturnValue(mockResponse),
      save: jest.fn().mockResolvedValue(true),
    };

    WordHunt.findById.mockResolvedValue(mockGame);

    const response = await initializeStoryInfo(
      "game123",
      "story123",
      storyInfo,
    );

    expect(WordHunt.findById).toHaveBeenCalledWith("game123");

    expect(mockGame.initializeStoryInfo).toHaveBeenCalledWith(
      mockStory,
      storyInfo,
    );

    expect(mockGame.save).toHaveBeenCalled();

    expect(response).toEqual(mockResponse);
  });

  it("should throw error when game is not found", async () => {
    WordHunt.findById.mockResolvedValue(null);

    await expect(
      initializeStoryInfo("invalidGameId", "story123", {}),
    ).rejects.toThrow("No Game Found By Given Id");

    expect(WordHunt.findById).toHaveBeenCalledWith("invalidGameId");
  });

  it("should throw error when story is not found", async () => {
    const mockGame = {
      stories: [
        {
          storyId: "anotherStory",
        },
      ],
    };

    WordHunt.findById.mockResolvedValue(mockGame);

    await expect(
      initializeStoryInfo("game123", "story123", {}),
    ).rejects.toThrow("No Story Found By Given Id");

    expect(WordHunt.findById).toHaveBeenCalledWith("game123");
  });

  it("should throw error when initializeStoryInfo fails", async () => {
    const storyInfo = {
      nounCount: 5,
      nounHint: 1,
      verbCount: 3,
      verbHint: 1,
      adjCount: 2,
      adjHint: 1,
    };

    const mockStory = {
      storyId: "story123",
    };

    const mockGame = {
      stories: [mockStory],
      initializeStoryInfo: jest.fn().mockImplementation(() => {
        throw new Error("Initialization Failed");
      }),
      save: jest.fn(),
    };

    WordHunt.findById.mockResolvedValue(mockGame);

    await expect(
      initializeStoryInfo("game123", "story123", storyInfo),
    ).rejects.toThrow("Initialization Failed");

    expect(mockGame.initializeStoryInfo).toHaveBeenCalledWith(
      mockStory,
      storyInfo,
    );

    expect(mockGame.save).not.toHaveBeenCalled();
  });

  it("should throw error when save fails", async () => {
    const storyInfo = {
      nounCount: 5,
      nounHint: 1,
      verbCount: 3,
      verbHint: 1,
      adjCount: 2,
      adjHint: 1,
    };

    const mockStory = {
      storyId: "story123",
    };

    const mockGame = {
      stories: [mockStory],
      initializeStoryInfo: jest.fn().mockReturnValue({
        message: "Story Info Initialized",
      }),
      save: jest.fn().mockRejectedValue(new Error("Database Save Failed")),
    };

    WordHunt.findById.mockResolvedValue(mockGame);

    await expect(
      initializeStoryInfo("game123", "story123", storyInfo),
    ).rejects.toThrow("Database Save Failed");

    expect(mockGame.initializeStoryInfo).toHaveBeenCalledWith(
      mockStory,
      storyInfo,
    );

    expect(mockGame.save).toHaveBeenCalled();
  });
});

describe("registerGameData Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const gameData = {
    bestTime: "0:30",
    coins: 5,
    totalScore: 10,
    hintsUsed: 1,
    foundWords: 5,
  };

  it("should register a noun game for an existing player", async () => {
    const player = {
      playerName: "Jack",
      games: {
        Noun: { history: [] },
        Verb: { history: [] },
        Adjective: { history: [] },
      },
      addNounGame: jest.fn(),
      addVerbGame: jest.fn(),
      addAdjGame: jest.fn(),
    };

    const story = {
      storyId: "story123",
      gameInfo: [player],
    };

    const game = {
      stories: [story],
      save: jest.fn().mockResolvedValue(true),
    };

    WordHunt.findById.mockResolvedValue(game);

    const response = await registerGameData(
      "game123",
      "story123",
      "player123",
      "Jack",
      gameData,
      "Noun",
    );

    expect(player.addNounGame).toHaveBeenCalledWith(gameData);
    expect(game.save).toHaveBeenCalled();
    expect(response).toBe(player);
  });

  it("should register a verb game", async () => {
    const player = {
      playerName: "Jack",
      games: {
        Noun: { history: [] },
        Verb: { history: [] },
        Adjective: { history: [] },
      },
      addNounGame: jest.fn(),
      addVerbGame: jest.fn(),
      addAdjGame: jest.fn(),
    };

    const game = {
      stories: [
        {
          storyId: "story123",
          gameInfo: [player],
        },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    WordHunt.findById.mockResolvedValue(game);

    await registerGameData(
      "game123",
      "story123",
      "player123",
      "Jack",
      gameData,
      "Verb",
    );

    expect(player.addVerbGame).toHaveBeenCalledWith(gameData);
    expect(game.save).toHaveBeenCalled();
  });

  it("should register an adjective game", async () => {
    const player = {
      playerName: "Jack",
      games: {
        Noun: { history: [] },
        Verb: { history: [] },
        Adjective: { history: [] },
      },
      addNounGame: jest.fn(),
      addVerbGame: jest.fn(),
      addAdjGame: jest.fn(),
    };

    const game = {
      stories: [
        {
          storyId: "story123",
          gameInfo: [player],
        },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    WordHunt.findById.mockResolvedValue(game);

    await registerGameData(
      "game123",
      "story123",
      "player123",
      "Jack",
      gameData,
      "Adjective",
    );

    expect(player.addAdjGame).toHaveBeenCalledWith(gameData);
    expect(game.save).toHaveBeenCalled();
  });

  it("should create a new player if player does not exist", async () => {
    const story = {
      storyId: "story123",
      gameInfo: [],
    };

    const game = {
      stories: [story],
      save: jest.fn().mockResolvedValue(true),
    };

    WordHunt.findById.mockResolvedValue(game);

    // Mock methods normally added by schema
    story.gameInfo.push = jest.fn(function (player) {
      Array.prototype.push.call(this, {
        ...player,
        addNounGame: jest.fn(),
        addVerbGame: jest.fn(),
        addAdjGame: jest.fn(),
      });
    });

    await registerGameData(
      "game123",
      "story123",
      "player123",
      "Jack",
      gameData,
      "Noun",
    );

    expect(story.gameInfo.push).toHaveBeenCalled();
    expect(game.save).toHaveBeenCalled();
  });

  it("should throw when game instance is invalid", async () => {
    await expect(
      registerGameData(
        "game123",
        "story123",
        "player123",
        "Jack",
        gameData,
        "Invalid",
      ),
    ).rejects.toThrow("Invalid Game Instance");
  });

  it("should throw when game cannot be found", async () => {
    WordHunt.findById.mockResolvedValue(null);

    await expect(
      registerGameData(
        "game123",
        "story123",
        "player123",
        "Jack",
        gameData,
        "Noun",
      ),
    ).rejects.toThrow("No Game Can be Found By Given Game Id");
  });

  it("should throw when story cannot be found", async () => {
    const game = {
      stories: [],
    };

    WordHunt.findById.mockResolvedValue(game);

    await expect(
      registerGameData(
        "game123",
        "story123",
        "player123",
        "Jack",
        gameData,
        "Noun",
      ),
    ).rejects.toThrow("No Story can be Found By Given Story Id");
  });

  it("should initialize missing game histories for older documents", async () => {
    const player = {
      playerName: "Jack",
      games: {},
      addNounGame: jest.fn(),
      addVerbGame: jest.fn(),
      addAdjGame: jest.fn(),
    };

    const game = {
      stories: [
        {
          storyId: "story123",
          gameInfo: [player],
        },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    WordHunt.findById.mockResolvedValue(game);

    await registerGameData(
      "game123",
      "story123",
      "player123",
      "Jack",
      gameData,
      "Noun",
    );

    expect(player.games.Noun).toBeDefined();
    expect(player.games.Verb).toBeDefined();
    expect(player.games.Adjective).toBeDefined();
  });

  it("should throw when save fails", async () => {
    const player = {
      playerName: "Jack",
      games: {
        Noun: { history: [] },
        Verb: { history: [] },
        Adjective: { history: [] },
      },
      addNounGame: jest.fn(),
      addVerbGame: jest.fn(),
      addAdjGame: jest.fn(),
    };

    const game = {
      stories: [
        {
          storyId: "story123",
          gameInfo: [player],
        },
      ],
      save: jest.fn().mockRejectedValue(new Error("Database Save Failed")),
    };

    WordHunt.findById.mockResolvedValue(game);

    await expect(
      registerGameData(
        "game123",
        "story123",
        "player123",
        "Jack",
        gameData,
        "Noun",
      ),
    ).rejects.toThrow("Database Save Failed");
  });
});

describe("retrievePlayerInfoByStory Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should retrieve story successfully", async () => {
    const mockStory = {
      storyId: "story123",
      nounWords: 5,
      verbWords: 3,
      adjWords: 2,
      gameInfo: [],
    };

    const mockGame = {
      stories: [mockStory],
    };

    WordHunt.findById.mockResolvedValue(mockGame);

    const response = await retrievePlayerInfoByStory(
      "game123",
      "story123",
      "Jack",
    );

    expect(WordHunt.findById).toHaveBeenCalledWith("game123");

    expect(response).toEqual(mockStory);
  });

  it("should throw error when game is not found", async () => {
    WordHunt.findById.mockResolvedValue(null);

    await expect(
      retrievePlayerInfoByStory("game123", "story123", "Jack"),
    ).rejects.toThrow("No Game Found By Given Id");

    expect(WordHunt.findById).toHaveBeenCalledWith("game123");
  });

  it("should throw error when story is not found", async () => {
    const mockGame = {
      stories: [
        {
          storyId: "story456",
        },
      ],
    };

    WordHunt.findById.mockResolvedValue(mockGame);

    await expect(
      retrievePlayerInfoByStory("game123", "story123", "Jack"),
    ).rejects.toThrow("No Story Found By Given Id");

    expect(WordHunt.findById).toHaveBeenCalledWith("game123");
  });

  it("should return story even when player does not exist", async () => {
    const mockStory = {
      storyId: "story123",
      gameInfo: [],
    };

    const mockGame = {
      stories: [mockStory],
    };

    WordHunt.findById.mockResolvedValue(mockGame);

    const response = await retrievePlayerInfoByStory(
      "game123",
      "story123",
      "UnknownPlayer",
    );

    expect(response).toEqual(mockStory);
  });

  it("should return story when gameInfo is empty", async () => {
    const mockStory = {
      storyId: "story123",
      nounWords: 0,
      verbWords: 0,
      adjWords: 0,
      gameInfo: [],
    };

    const mockGame = {
      stories: [mockStory],
    };

    WordHunt.findById.mockResolvedValue(mockGame);

    const response = await retrievePlayerInfoByStory(
      "game123",
      "story123",
      "Jack",
    );

    expect(response.gameInfo).toEqual([]);
    expect(response).toEqual(mockStory);
  });
});
