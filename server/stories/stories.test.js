const request = require("supertest");

jest.mock("../raw-data-connect/retrieveTokenizedStoryById", () => ({
  retrieveStoryById: jest.fn(),
  retrieveRandomStory: jest.fn(),
}));

// The controller now reads active ids from storySetsService (DB-backed).
// Mock it so these tests stay pure route/controller tests with no Mongo.
jest.mock("../storySets/storySetsService", () => ({
  getActiveStoryIds: jest.fn(),
}));

const {
  retrieveStoryById,
} = require("../raw-data-connect/retrieveTokenizedStoryById");
const {
  getActiveStoryIds: getActiveStoryIdsFromDb,
} = require("../storySets/storySetsService");
const { getActiveStoryIds } = require("../activeStoriesConfig");
const app = require("../app");

const ACTIVE_IDS = getActiveStoryIds();

beforeEach(() => {
  getActiveStoryIdsFromDb.mockResolvedValue([...ACTIVE_IDS]);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/v1/stories/active", () => {
  it("returns one entry per configured active story, with a title", async () => {
    retrieveStoryById.mockImplementation(async (id) => ({
      _id: id,
      title: "Plain Title",
      category: "Fable",
    }));

    const response = await request(app)
      .get("/api/v1/stories/active")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(ACTIVE_IDS.length);
    expect(response.body.data[0]).toEqual({
      storyId: ACTIVE_IDS[0],
      title: "Plain Title",
      category: "Fable",
    });
    // Every configured id is looked up in tokenized_stories.
    ACTIVE_IDS.forEach((id) => {
      expect(retrieveStoryById).toHaveBeenCalledWith(id);
    });
  });

  it("resolves a localized (object) title to a readable string", async () => {
    retrieveStoryById.mockResolvedValue({
      _id: "x",
      title: { english: "The Clever Crow" },
      category: "Panchatantra",
    });

    const response = await request(app)
      .get("/api/v1/stories/active")
      .expect(200);

    expect(response.body.data[0].title).toBe("The Clever Crow");
  });

  it("skips a configured id that can't be resolved instead of failing the whole request", async () => {
    // First id throws (e.g. deleted from the collection); the rest resolve.
    retrieveStoryById.mockImplementation(async (id) => {
      if (id === ACTIVE_IDS[0]) {
        throw new Error("No Tokenized story found by given Id");
      }
      return { _id: id, title: "Ok", category: "Fable" };
    });

    const response = await request(app)
      .get("/api/v1/stories/active")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(ACTIVE_IDS.length - 1);
    expect(
      response.body.data.some((s) => s.storyId === ACTIVE_IDS[0]),
    ).toBe(false);
  });
});
