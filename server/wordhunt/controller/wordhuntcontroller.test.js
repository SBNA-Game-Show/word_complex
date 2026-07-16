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
