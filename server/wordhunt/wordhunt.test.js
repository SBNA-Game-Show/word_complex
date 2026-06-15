const findNounVerbAndAdjEnglish = require("./service/findNounsVerbsAndAdjectivesGameEnglish");
const { retrieveStoryById } = require("../raw-data-connect/retrieveTokenizedStoryById");

jest.mock("../raw-data-connect/retrieveTokenizedStoryById");

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
