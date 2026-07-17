const request = require("supertest");
const app = require("../../app");

jest.mock("../service/findNounsVerbsAndAdjectivesGameEnglish");
jest.mock("../service/findNounsVerbsAndAdjectivesGameSanskrit");

const findNounVerbAndAdjEnglish = require("../service/findNounsVerbsAndAdjectivesGameEnglish");
const findNounVerbAndAdjSanskrit = require("../service/findNounsVerbsAndAdjectivesGameSanskrit");

const {
  initWordHuntRepo,
  retrieveAllMetaData,
  insertStroyInfo,
  insertGameData,
  getPlayerInfoByStory,
} = require("../service/gameservice");

jest.mock("../service/gameservice.js", () => ({
  initWordHuntRepo: jest.fn(),
  retrieveAllMetaData: jest.fn(),
  insertStroyInfo: jest.fn(),
  insertGameData: jest.fn(),
  getPlayerInfoByStory: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe("Wordhunt Controller Tests", () => {
  const eng_response = {
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
  };

  const sa_response = {
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
  };

  describe("POSEnglish Controller", () => {
    it("should return 200 with english POS data", async () => {
      findNounVerbAndAdjEnglish.mockResolvedValue(eng_response);

      const response = await request(app).get(
        "/api/v1/wordHunt/POSEnglish?storyId=123",
      );

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        data: eng_response,
      });

      expect(findNounVerbAndAdjEnglish).toHaveBeenCalledWith("123");
    });

    it("should return 400 when storyId missing", async () => {
      const response = await request(app).get("/api/v1/wordHunt/POSEnglish");

      expect(response.status).toBe(400);

      expect(response.body.message).toBe("storyId is required");
    });

    it("should return 500 when service fails", async () => {
      findNounVerbAndAdjEnglish.mockRejectedValue(
        new Error("Database failure"),
      );

      const response = await request(app).get(
        "/api/v1/wordHunt/POSEnglish?storyId=123",
      );

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Database failure");
    });
  });

  describe("POSSanskrit Controller", () => {
    it("should return 200 with Sanskrit POS data", async () => {
      findNounVerbAndAdjSanskrit.mockResolvedValue(sa_response);

      const response = await request(app).get(
        "/api/v1/wordHunt/POSSanskrit?storyId=123",
      );

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        data: sa_response,
      });

      expect(findNounVerbAndAdjSanskrit).toHaveBeenCalledWith("123");
    });

    it("should return 400 when Sanskrit storyId missing", async () => {
      const response = await request(app).get("/api/v1/wordHunt/POSSanskrit");

      expect(response.status).toBe(400);

      expect(response.body.message).toBe("storyId is required");
    });

    it("should return 500 when Sanskrit service fails", async () => {
      findNounVerbAndAdjSanskrit.mockRejectedValue(
        new Error("Sanskrit failure"),
      );

      const response = await request(app).get(
        "/api/v1/wordHunt/POSSanskrit?storyId=123",
      );

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Sanskrit failure");
    });
  });
});

describe("Word Hunt gameController Tests", () => {
  describe("addStoryInfo Tests", () => {
    it("should add story information successfully", async () => {
      const storyInfoResponse = {
        success: true,
        message: "Story Info Registered Successfully",
      };

      insertStroyInfo.mockResolvedValue(storyInfoResponse);

      const response = await request(app)
        .post("/api/v1/wordHunt/addStoryInfo")
        .send({
          gameId: "game123",
          storyId: "story123",
          nounGameWords: 5,
          nounGameHints: 1,
          verbGameWords: 3,
          verbGameHints: 1,
          adjGameWords: 2,
          adjGameHints: 1,
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: storyInfoResponse,
      });

      expect(insertStroyInfo).toHaveBeenCalledTimes(1);

      expect(insertStroyInfo).toHaveBeenCalledWith(
        "game123",
        "story123",
        expect.objectContaining({
          nounGameWords: 5,
          nounGameHints: 1,
          verbGameWords: 3,
          verbGameHints: 1,
          adjGameWords: 2,
          adjGameHints: 1,
        }),
      );
    });

    it("should return 500 when service throws error", async () => {
      insertStroyInfo.mockRejectedValue(new Error("Story Information Failed"));

      const response = await request(app)
        .post("/api/v1/wordHunt/addStoryInfo")
        .send({
          gameId: "game123",
          storyId: "story123",
          nounGameWords: 5,
          nounGameHints: 1,
          verbGameWords: 3,
          verbGameHints: 1,
          adjGameWords: 2,
          adjGameHints: 1,
        });

      expect(response.status).toBe(500);

      expect(response.body).toEqual({
        success: false,
        message: "Story Information Failed",
      });

      expect(insertStroyInfo).toHaveBeenCalledTimes(1);
    });

    it("should return 500 when gameId is missing", async () => {
      insertStroyInfo.mockRejectedValue(new Error("Game Id is Required"));

      const response = await request(app)
        .post("/api/v1/wordHunt/addStoryInfo")
        .send({
          storyId: "story123",
          nounGameWords: 5,
          nounGameHints: 1,
          verbGameWords: 3,
          verbGameHints: 1,
          adjGameWords: 2,
          adjGameHints: 1,
        });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Game Id is Required");
    });

    it("should return 500 when storyId is missing", async () => {
      insertStroyInfo.mockRejectedValue(new Error("Story Id is Required"));

      const response = await request(app)
        .post("/api/v1/wordHunt/addStoryInfo")
        .send({
          gameId: "game123",
          nounGameWords: 5,
          nounGameHints: 1,
          verbGameWords: 3,
          verbGameHints: 1,
          adjGameWords: 2,
          adjGameHints: 1,
        });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Story Id is Required");
    });

    it("should handle already initialized story information", async () => {
      insertStroyInfo.mockResolvedValue({
        success: true,
        message: "Story Information Already Initialized",
      });

      const response = await request(app)
        .post("/api/v1/wordHunt/addStoryInfo")
        .send({
          gameId: "game123",
          storyId: "story123",
          nounGameWords: 5,
          nounGameHints: 1,
          verbGameWords: 3,
          verbGameHints: 1,
          adjGameWords: 2,
          adjGameHints: 1,
        });

      expect(response.status).toBe(200);

      expect(response.body.message.message).toBe(
        "Story Information Already Initialized",
      );
    });

    it("should pass StoryInfo object to service layer", async () => {
      insertStroyInfo.mockResolvedValue({
        success: true,
        message: "Success",
      });

      await request(app).post("/api/v1/wordHunt/addStoryInfo").send({
        gameId: "game123",
        storyId: "story123",
        nounGameWords: 7,
        nounGameHints: 1,
        verbGameWords: 14,
        verbGameHints: 2,
        adjGameWords: 3,
        adjGameHints: 1,
      });

      const passedStoryInfo = insertStroyInfo.mock.calls[0][2];

      expect(passedStoryInfo.nounGameWords).toBe(7);

      expect(passedStoryInfo.verbGameWords).toBe(14);

      expect(passedStoryInfo.adjGameWords).toBe(3);
    });
  });
  describe("addGameData Tests", () => {
    it("should add game data successfully", async () => {
      const mockResponse = {
        playerName: "Jack",
        gameInstance: "Noun",
        totalScore: 10,
        coins: 2,
      };

      insertGameData.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/api/v1/wordHunt/addGameData")
        .send({
          gameId: "game123",
          storyId: "story123",
          playerId: "player123",
          playerName: "Jack",
          bestTime: "0:45",
          coins: 2,
          totalScore: 10,
          hintsUsed: 1,
          foundWords: 5,
          gameInstance: "Noun",
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: mockResponse,
      });

      expect(insertGameData).toHaveBeenCalledTimes(1);

      expect(insertGameData).toHaveBeenCalledWith(
        "game123",
        "story123",
        "player123",
        "Jack",
        expect.objectContaining({
          bestTime: "0:45",
          coins: 2,
          totalScore: 10,
          hintsUsed: 1,
          foundWords: 5,
        }),
        "Noun",
      );
    });

    it("should return 500 when service layer fails", async () => {
      insertGameData.mockRejectedValue(new Error("Database Failure"));

      const response = await request(app)
        .post("/api/v1/wordHunt/addGameData")
        .send({
          gameId: "game123",
          storyId: "story123",
          playerId: "player123",
          playerName: "Jack",
          bestTime: "0:45",
          coins: 2,
          totalScore: 10,
          hintsUsed: 1,
          foundWords: 5,
          gameInstance: "Noun",
        });

      expect(response.status).toBe(500);

      expect(response.body).toEqual({
        success: false,
        message: "Database Failure",
      });
    });

    it("should return 500 when gameId is missing", async () => {
      insertGameData.mockRejectedValue(new Error("Game Id is Required"));

      const response = await request(app)
        .post("/api/v1/wordHunt/addGameData")
        .send({
          storyId: "story123",
          playerId: "player123",
          playerName: "Jack",
          bestTime: "0:45",
          coins: 2,
          totalScore: 10,
          hintsUsed: 1,
          foundWords: 5,
          gameInstance: "Noun",
        });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Game Id is Required");
    });

    it("should return 500 when storyId is missing", async () => {
      insertGameData.mockRejectedValue(new Error("Story Id is Required"));

      const response = await request(app)
        .post("/api/v1/wordHunt/addGameData")
        .send({
          gameId: "game123",
          playerId: "player123",
          playerName: "Jack",
          bestTime: "0:45",
          coins: 2,
          totalScore: 10,
          hintsUsed: 1,
          foundWords: 5,
          gameInstance: "Noun",
        });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Story Id is Required");
    });

    it("should return 500 when playerId is missing", async () => {
      insertGameData.mockRejectedValue(new Error("Player Id is Required"));

      const response = await request(app)
        .post("/api/v1/wordHunt/addGameData")
        .send({
          gameId: "game123",
          storyId: "story123",
          playerName: "Jack",
          bestTime: "0:45",
          coins: 2,
          totalScore: 10,
          hintsUsed: 1,
          foundWords: 5,
          gameInstance: "Noun",
        });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Player Id is Required");
    });

    it("should return 500 when player name is missing", async () => {
      insertGameData.mockRejectedValue(new Error("Player Name is Required"));

      const response = await request(app)
        .post("/api/v1/wordHunt/addGameData")
        .send({
          gameId: "game123",
          storyId: "story123",
          playerId: "player123",
          bestTime: "0:45",
          coins: 2,
          totalScore: 10,
          hintsUsed: 1,
          foundWords: 5,
          gameInstance: "Noun",
        });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Player Name is Required");
    });

    it("should return 500 when invalid game instance is passed", async () => {
      insertGameData.mockRejectedValue(new Error("Invalid Game Instance"));

      const response = await request(app)
        .post("/api/v1/wordHunt/addGameData")
        .send({
          gameId: "game123",
          storyId: "story123",
          playerId: "player123",
          playerName: "Jack",
          bestTime: "0:45",
          coins: 2,
          totalScore: 10,
          hintsUsed: 1,
          foundWords: 5,
          gameInstance: "Invalid",
        });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Invalid Game Instance");
    });

    it("should pass GameData object to service layer", async () => {
      insertGameData.mockResolvedValue({
        success: true,
        message: "Game Saved",
      });

      await request(app).post("/api/v1/wordHunt/addGameData").send({
        gameId: "game123",
        storyId: "story123",
        playerId: "player123",
        playerName: "Jack",
        bestTime: "1:00",
        coins: 5,
        totalScore: 20,
        hintsUsed: 2,
        foundWords: 10,
        gameInstance: "Verb",
      });

      const passedGameData = insertGameData.mock.calls[0][4];

      expect(passedGameData.bestTime).toBe("1:00");

      expect(passedGameData.coins).toBe(5);

      expect(passedGameData.totalScore).toBe(20);

      expect(passedGameData.hintsUsed).toBe(2);

      expect(passedGameData.foundWords).toBe(10);
    });
  });
  describe("fetchPlayerData Tests", () => {
    it("should retrieve player data successfully", async () => {
      const mockPlayerData = {
        storyId: "story123",
        earnedCoins: 10,
        earnedScore: 50,
        games: {
          Noun: {
            bestTime: "0:30",
            totalScore: 20,
          },
          Verb: null,
          Adjective: null,
        },
      };

      getPlayerInfoByStory.mockResolvedValue(mockPlayerData);

      const response = await request(app)
        .get("/api/v1/wordHunt/playerData")
        .query({
          gameId: "game123",
          storyId: "story123",
          playerName: "Jack",
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: mockPlayerData,
      });

      expect(getPlayerInfoByStory).toHaveBeenCalledTimes(1);

      expect(getPlayerInfoByStory).toHaveBeenCalledWith(
        "game123",
        "story123",
        "Jack",
      );
    });

    it("should return 500 when gameId is missing", async () => {
      getPlayerInfoByStory.mockRejectedValue(new Error("Game Id is Required"));

      const response = await request(app)
        .get("/api/v1/wordHunt/playerData")
        .query({
          storyId: "story123",
          playerName: "Jack",
        });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Game Id is Required");
    });

    it("should return 500 when storyId is missing", async () => {
      getPlayerInfoByStory.mockRejectedValue(new Error("Story Id is Required"));

      const response = await request(app)
        .get("/api/v1/wordHunt/playerData")
        .query({
          gameId: "game123",
          playerName: "Jack",
        });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Story Id is Required");
    });

    it("should return 500 when playerName is missing", async () => {
      getPlayerInfoByStory.mockRejectedValue(
        new Error("Player Id is Required"),
      );

      const response = await request(app)
        .get("/api/v1/wordHunt/playerData")
        .query({
          gameId: "game123",
          storyId: "story123",
        });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe("Player Id is Required");
    });

    it("should return 500 when service fails", async () => {
      getPlayerInfoByStory.mockRejectedValue(new Error("Database Failure"));

      const response = await request(app)
        .get("/api/v1/wordHunt/playerData")
        .query({
          gameId: "game123",
          storyId: "story123",
          playerName: "Jack",
        });

      expect(response.status).toBe(500);

      expect(response.body).toEqual({
        success: false,
        message: "Database Failure",
      });

      expect(getPlayerInfoByStory).toHaveBeenCalledWith(
        "game123",
        "story123",
        "Jack",
      );
    });

    it("should return empty player information successfully", async () => {
      const emptyResponse = {
        storyId: "story123",
        earnedCoins: 0,
        earnedScore: 0,
        games: {
          Noun: null,
          Verb: null,
          Adjective: null,
        },
      };

      getPlayerInfoByStory.mockResolvedValue(emptyResponse);

      const response = await request(app)
        .get("/api/v1/wordHunt/playerData")
        .query({
          gameId: "game123",
          storyId: "story123",
          playerName: "NewPlayer",
        });

      expect(response.status).toBe(200);

      expect(response.body.message).toEqual(emptyResponse);
    });
  });
});
