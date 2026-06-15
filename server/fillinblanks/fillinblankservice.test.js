const {
  getNumberOfBlanks,
  getAnswers,
  getDistractors,
  createFillInBlankGame,
} = require("./services/fillinblankservice");

describe("Fill in the Blank Service Tests", () => {
it("should return 3 for easy difficulty", () => {
    expect(getNumberOfBlanks("easy")).toBe(3);
  });

  it("should return 6 for medium difficulty", () => {
    expect(getNumberOfBlanks("medium")).toBe(6);
  });

  it("should return 9 for hard difficulty", () => {
    expect(getNumberOfBlanks("hard")).toBe(9);
  });

  it("should return 3 for invalid difficulty", () => {
    expect(getNumberOfBlanks("unknown")).toBe(3);
  });
});

describe("getAnswers", () => {
  it("should return only selected word types", () => {
    const tokenizedWords = [
      { text: "cat", pos: "NOUN" },
      { text: "runs", pos: "VERB" },
      { text: "dog", pos: "NOUN" },
    ];

    const result = getAnswers(tokenizedWords, ["NOUN"], 2);

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining(["cat", "dog"]));
    expect(result).not.toContain("runs");
  });
});

describe("getDistractors", () => {
  it("should not include answer words as distractors", () => {
    const tokenizedWords = [
      { text: "cat", pos: "NOUN" },
      { text: "dog", pos: "NOUN" },
      { text: "bird", pos: "NOUN" },
    ];

    const answers = ["cat"];

    const result = getDistractors(tokenizedWords, answers, ["NOUN"], 2);

    expect(result).toHaveLength(2);
    expect(result).not.toContain("cat");
  });
});

describe("createFillInBlankGame", () => {
  it("should replace answer words with blanks and return game data", () => {
    const result = createFillInBlankGame(
      "story123",
      "The cat runs fast.",
      ["cat", "runs"],
      ["dog", "walks"]
    );

    expect(result.id).toBe("story123");
    expect(result.originalParagraph).toBe("The cat runs fast.");
    expect(result.paragraph).toBe("The _____ _____ fast.");
    expect(result.answers).toEqual(["cat", "runs"]);
    expect(result.wordBank).toHaveLength(4);
    expect(result.wordBank).toEqual(
      expect.arrayContaining(["cat", "runs", "dog", "walks"])
    );
  });
});