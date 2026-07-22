const request = require("supertest");

// Mock the Mongo connection with an in-memory fake (per-test, reset each time)
jest.mock("../config/dataConnectConfig", () => {
  const fn = jest.fn();
  fn.close = jest.fn();
  return fn;
});

jest.mock("../raw-data-connect/retrieveTokenizedStoryById", () => ({
  retrieveStoryById: jest.fn(),
  retrieveRandomStory: jest.fn(),
}));

// createSet initializes the Word Hunt repo, which otherwise reaches the real
// Mongoose model and opens a DB connection that never settles — leaving an open
// handle that hangs Jest. Stub it out.
jest.mock("../wordhunt/service/gameservice", () => ({
  initWordHuntRepo: jest.fn().mockResolvedValue({}),
}));

// These are route/service tests; the admin gate is verified separately in
// middleware/requireAdmin.test.js. Bypass it here so requests don't need a real
// Firebase token (the .set(ADMIN) headers below are now harmless no-ops).
jest.mock("../middleware/requireAdmin", () => (req, res, next) => next());

const connectDb = require("../config/dataConnectConfig");
const {
  retrieveStoryById,
} = require("../raw-data-connect/retrieveTokenizedStoryById");
const {
  getActiveStoryIds: getFallbackStoryIds,
} = require("../activeStoriesConfig");
const service = require("./storySetsService");
const app = require("../app");

const ADMIN = { "x-role": "ADMIN" };

/* Minimal in-memory stand-in for the two collections the service touches. */
function createFakeDb() {
  const store = new Map(); // collectionName -> Map(_id -> doc)

  const collection = (name) => {
    if (!store.has(name)) store.set(name, new Map());
    const docs = store.get(name);

    return {
      findOne: async (query) => {
        const doc = docs.get(query._id);
        return doc ? { ...doc } : null;
      },
      find: () => ({
        sort: () => ({
          toArray: async () => [...docs.values()].map((d) => ({ ...d })),
        }),
      }),
      insertOne: async (doc) => {
        docs.set(doc._id, { ...doc });
        return { insertedId: doc._id };
      },
      updateOne: async (query, update, options = {}) => {
        const existing = docs.get(query._id);
        if (existing) {
          docs.set(query._id, { ...existing, ...update.$set });
          return { matchedCount: 1, modifiedCount: 1 };
        }
        if (options.upsert) {
          docs.set(query._id, { _id: query._id, ...update.$set });
          return { matchedCount: 0, upsertedId: query._id };
        }
        return { matchedCount: 0, modifiedCount: 0 };
      },
      deleteOne: async (query) => ({
        deletedCount: docs.delete(query._id) ? 1 : 0,
      }),
      countDocuments: async () => docs.size,
    };
  };

  return { db: { collection }, store };
}

let fake;

const setsMap = () => fake.store.get(service.SETS_COLLECTION);
const configMap = () => fake.store.get(service.CONFIG_COLLECTION);

/* Arrange helper: put a set (and optionally the active pointer) in the fake. */
function seedSet({ _id, name = "Seeded", storyIds = ["s1"], active = false }) {
  fake.db.collection(service.SETS_COLLECTION); // ensure map exists
  fake.store.get(service.SETS_COLLECTION).set(_id, {
    _id,
    name,
    storyIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  if (active) {
    fake.db.collection(service.CONFIG_COLLECTION);
    fake.store.get(service.CONFIG_COLLECTION).set(service.ACTIVE_POINTER_ID, {
      _id: service.ACTIVE_POINTER_ID,
      setId: _id,
    });
  }
}

beforeEach(() => {
  fake = createFakeDb();
  connectDb.mockResolvedValue(fake.db);
  // Every storyId resolves unless a test says otherwise.
  retrieveStoryById.mockResolvedValue({ _id: "any", title: "Ok" });
});

afterEach(() => {
  jest.clearAllMocks();
});

// The admin gate itself is covered in middleware/requireAdmin.test.js; here the
// middleware is mocked (see jest.mock above) so these focus on route behavior.

describe("GET /api/v1/admin/storySets", () => {
  it("lists all sets and flags the active one", async () => {
    seedSet({ _id: "set-a", name: "A" });
    seedSet({ _id: "set-b", name: "B", active: true });

    const res = await request(app)
      .get("/api/v1/admin/storySets")
      .set(ADMIN)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    const byId = Object.fromEntries(res.body.data.map((s) => [s._id, s]));
    expect(byId["set-a"].isActive).toBe(false);
    expect(byId["set-b"].isActive).toBe(true);
  });
});

describe("GET /api/v1/storySets/active", () => {
  it("returns only the active Story Set ID without admin authentication", async () => {
    seedSet({ _id: "set-active", storyIds: ["s1", "s2"], active: true });

    const res = await request(app).get("/api/v1/storySets/active").expect(200);

    expect(res.body).toEqual({
      success: true,
      data: { setId: "set-active" },
    });
  });

  it("returns JSON 404 when no Story Set is active", async () => {
    const res = await request(app).get("/api/v1/storySets/active").expect(404);

    expect(res.body).toEqual({
      success: false,
      message: "No active story set found",
    });
  });

  it("returns JSON 500 when the active pointer cannot be read", async () => {
    connectDb.mockRejectedValue(new Error("atlas down"));

    const res = await request(app).get("/api/v1/storySets/active").expect(500);

    expect(res.body).toEqual({
      success: false,
      message: "atlas down",
    });
  });
});

describe("POST /api/v1/admin/storySets", () => {
  it("creates a set from valid input", async () => {
    const res = await request(app)
      .post("/api/v1/admin/storySets")
      .set(ADMIN)
      .send({ name: "Week 9 set", storyIds: ["s1", "s2"] })
      .expect(201);

    expect(res.body.data.name).toBe("Week 9 set");
    expect(res.body.data.storyIds).toEqual(["s1", "s2"]);
    expect(setsMap().get(res.body.data._id)).toBeDefined();
  });

  it.each([
    ["missing name", { storyIds: ["s1"] }],
    ["empty name", { name: "  ", storyIds: ["s1"] }],
    ["storyIds not an array", { name: "X", storyIds: "s1" }],
    ["empty storyIds", { name: "X", storyIds: [] }],
    ["more than 4 storyIds", { name: "X", storyIds: ["a", "b", "c", "d", "e"] }],
    ["duplicate storyIds", { name: "X", storyIds: ["a", "a"] }],
    ["non-string storyId", { name: "X", storyIds: [42] }],
  ])("400s on %s", async (_label, payload) => {
    const res = await request(app)
      .post("/api/v1/admin/storySets")
      .set(ADMIN)
      .send(payload)
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  it("409s when the same story combination already exists — order-insensitive", async () => {
    seedSet({ _id: "set-a", name: "Original", storyIds: ["s1", "s2"] });

    const res = await request(app)
      .post("/api/v1/admin/storySets")
      .set(ADMIN)
      .send({ name: "Different name, same stories", storyIds: ["s2", "s1"] })
      .expect(409);

    expect(res.body.message).toContain("already exists");
    expect(res.body.message).toContain("Original");
    expect(setsMap().size).toBe(1); // nothing new written
  });

  it("allows a different combination that overlaps an existing set", async () => {
    seedSet({ _id: "set-a", storyIds: ["s1", "s2"] });

    await request(app)
      .post("/api/v1/admin/storySets")
      .set(ADMIN)
      .send({ name: "Overlapping but different", storyIds: ["s1", "s3"] })
      .expect(201);

    expect(setsMap().size).toBe(2);
  });

  it("400s naming the storyIds that don't exist in tokenized_stories", async () => {
    retrieveStoryById.mockImplementation(async (id) => {
      if (id === "ghost") throw new Error("No Tokenized story found");
      return { _id: id };
    });

    const res = await request(app)
      .post("/api/v1/admin/storySets")
      .set(ADMIN)
      .send({ name: "X", storyIds: ["real", "ghost"] })
      .expect(400);

    expect(res.body.message).toContain("ghost");
    expect(res.body.message).not.toContain("real,");
    expect(setsMap()?.size ?? 0).toBe(0); // nothing written
  });
});

describe("PUT /api/v1/admin/storySets/active", () => {
  it("flips the pointer to an existing set", async () => {
    seedSet({ _id: "set-a", active: true });
    seedSet({ _id: "set-b" });

    await request(app)
      .put("/api/v1/admin/storySets/active")
      .set(ADMIN)
      .send({ setId: "set-b" })
      .expect(200);

    expect(configMap().get(service.ACTIVE_POINTER_ID).setId).toBe("set-b");
  });

  it("404s on a setId that doesn't exist", async () => {
    await request(app)
      .put("/api/v1/admin/storySets/active")
      .set(ADMIN)
      .send({ setId: "nope" })
      .expect(404);
  });

  it("400s without a setId", async () => {
    await request(app)
      .put("/api/v1/admin/storySets/active")
      .set(ADMIN)
      .send({})
      .expect(400);
  });
});

// NOTE: there is deliberately no PUT /:setId suite — sets are immutable (2026-07-08).

describe("DELETE /api/v1/admin/storySets/:setId", () => {
  it("refuses (409) to delete the active set", async () => {
    seedSet({ _id: "set-a", active: true });

    await request(app)
      .delete("/api/v1/admin/storySets/set-a")
      .set(ADMIN)
      .expect(409);

    expect(setsMap().has("set-a")).toBe(true);
  });

  it("deletes a non-active set", async () => {
    seedSet({ _id: "set-a", active: true });
    seedSet({ _id: "set-b" });

    await request(app)
      .delete("/api/v1/admin/storySets/set-b")
      .set(ADMIN)
      .expect(200);

    expect(setsMap().has("set-b")).toBe(false);
  });

  it("404s on an unknown set", async () => {
    await request(app)
      .delete("/api/v1/admin/storySets/nope")
      .set(ADMIN)
      .expect(404);
  });
});

describe("service.getActiveStoryIds (picker read path)", () => {
  it("returns the active set's storyIds", async () => {
    seedSet({ _id: "set-a", storyIds: ["s1", "s2", "s3"], active: true });
    await expect(service.getActiveStoryIds()).resolves.toEqual([
      "s1",
      "s2",
      "s3",
    ]);
  });

  it("falls back to the static config when nothing is seeded", async () => {
    await expect(service.getActiveStoryIds()).resolves.toEqual(
      getFallbackStoryIds(),
    );
  });

  it("falls back to the static config when the DB read throws", async () => {
    connectDb.mockRejectedValue(new Error("atlas down"));
    await expect(service.getActiveStoryIds()).resolves.toEqual(
      getFallbackStoryIds(),
    );
  });
});
