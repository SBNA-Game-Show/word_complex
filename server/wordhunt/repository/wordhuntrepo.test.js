const WordHunt = require("./schema/WordHunt");
const { initializeGame, getAllGameInfo } = require("./wordhuntrepo");

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
