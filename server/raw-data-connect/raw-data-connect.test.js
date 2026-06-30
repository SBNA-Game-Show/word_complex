jest.mock("../config/dataConnectConfig", () => jest.fn());

const connectTokenizedStories = require("../config/dataConnectConfig");
const retrieveAllStories = require("./retrieveAllTokenizedStories");
const { retrieveStoryById } = require("./retrieveTokenizedStoryById");

function createMockDb(stories = []) {
  return {
    collection: jest.fn(() => ({
      find: jest.fn(() => ({
        toArray: jest.fn().mockResolvedValue(stories),
      })),
      findOne: jest.fn(({ _id }) =>
        Promise.resolve(stories.find((story) => story._id === _id) || null),
      ),
    })),
  };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("Retrieve All Tokenized Stories Tests", () => {
  it("should successfully retrieve all stories", async () => {
    const stories = [
      {
        _id: "1",
        title: "Aesop",
        origin: "Aesop",
      },
      {
        _id: "2",
        title: "Panchatantra",
        origin: "Panchatantra",
      },
    ];

    connectTokenizedStories.mockResolvedValue(createMockDb(stories));

    const result = await retrieveAllStories();

    expect(result).toHaveLength(2);

    expect(result[0]).toMatchObject({
      _id: "1",
      title: "Aesop",
      origin: "Aesop",
    });

    expect(result[1]).toMatchObject({
      _id: "2",
      title: "Panchatantra",
      origin: "Panchatantra",
    });
  });

  it("should return an empty array when collection is empty", async () => {
    connectTokenizedStories.mockResolvedValue(createMockDb([]));

    const result = await retrieveAllStories();

    expect(result).toEqual([]);
  });

  it("should throw when connection fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    connectTokenizedStories.mockRejectedValue(
      new Error("Database connection failed"),
    );

    await expect(retrieveAllStories()).rejects.toThrow(
      "Database connection failed",
    );

    console.error.mockRestore();
  });
});

describe("Retrieve Tokenized Story By Id", () => {
  it("should should throw and error. Story Id is Missing", async () => {
    connectTokenizedStories.mockResolvedValue(
      createMockDb([
        {
          _id: "1",
          title: "Aesop",
          origin: "Aesop",
        },
        {
          _id: "2",
          title: "Panchatantra",
          origin: "Panchatantra",
        },
      ]),
    );

    await expect(retrieveStoryById("")).rejects.toThrow("Story Id is Required");
  });

  it("should successfully retrieve a story given a valid Id", async () => {
    connectTokenizedStories.mockResolvedValue(
      createMockDb([
        {
          _id: "1",
          title: "Aesop",
          origin: "Aesop",
        },
        {
          _id: "2",
          title: "Panchatantra",
          origin: "Panchatantra",
        },
      ]),
    );

    const story = await retrieveStoryById("1");

    expect(story).toMatchObject({
      _id: "1",
      title: "Aesop",
      origin: "Aesop",
    });
  });

  it("should throw an error when no tokenized story is found by the given id", async () => {
    connectTokenizedStories.mockResolvedValue(
      createMockDb([
        {
          _id: "1",
          title: "Aesop",
          origin: "Aesop",
        },
        {
          _id: "2",
          title: "Panchatantra",
          origin: "Panchatantra",
        },
      ]),
    );

    await expect(retrieveStoryById("999")).rejects.toThrow(
      "No Tokenized story found by given Id",
    );
  });
});
