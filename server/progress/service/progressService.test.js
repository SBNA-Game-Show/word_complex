/**
 * Service tests — exercise the load → decide → upsert path against an
 * in-memory stand-in for the `progress` collection (same approach the rest of
 * the server's tests use: mock config/dataConnectConfig).
 */

// Minimal fake DB: one Map of _id -> doc, supporting the two calls the service
// makes (findOne, updateOne with $set + upsert).
jest.mock("../../config/dataConnectConfig", () => {
  const store = new Map();

  const collection = () => ({
    findOne: async ({ _id }) => {
      const doc = store.get(_id);
      return doc ? { ...doc } : null;
    },
    updateOne: async ({ _id }, update, options = {}) => {
      const existing = store.get(_id);
      if (existing) {
        store.set(_id, { ...existing, ...update.$set });
        return { matchedCount: 1, modifiedCount: 1 };
      }
      if (options.upsert) {
        store.set(_id, { _id, ...update.$set });
        return { matchedCount: 0, upsertedCount: 1 };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    },
  });

  const connect = jest.fn(async () => ({ collection }));
  connect.close = jest.fn();
  connect.__store = store;
  return connect;
});

const connect = require("../../config/dataConnectConfig");
const {
  getProgress,
  registerVisit,
  buyCharacter,
} = require("./progressService");

const at = (dateKey) => new Date(`${dateKey}T12:00:00`);
const seed = (uid, doc) => connect.__store.set(uid, { _id: uid, ...doc });

beforeEach(() => connect.__store.clear());

describe("registerVisit", () => {
  it("creates a doc and awards day-1 stars on first visit", async () => {
    const state = await registerVisit("u1", at("2026-07-11"));
    expect(state).toMatchObject({
      streak: 1,
      stars: 5,
      ownedCharacters: ["tomely", "sprout", "bubbles"],
      awardedStars: 5,
      isNewDay: true,
    });
  });

  it("accumulates stars across consecutive days", async () => {
    await registerVisit("u1", at("2026-07-11")); // +5
    const state = await registerVisit("u1", at("2026-07-12")); // +6
    expect(state).toMatchObject({ streak: 2, stars: 11 });
  });

  it("does not award twice on the same day", async () => {
    await registerVisit("u1", at("2026-07-11"));
    const state = await registerVisit("u1", at("2026-07-11"));
    expect(state).toMatchObject({ streak: 1, stars: 5, awardedStars: 0 });
  });

  it("adds a milestone character to the owned set", async () => {
    seed("u1", {
      streak: 9,
      lastVisitDate: "2026-07-10",
      stars: 100,
      ownedCharacters: ["tomely", "sprout", "bubbles"],
    });
    const state = await registerVisit("u1", at("2026-07-11"));
    expect(state.streak).toBe(10);
    expect(state.ownedCharacters).toContain("luna");
    expect(state.giftedCharacters).toEqual(["luna"]);
  });

  it("persists between visits", async () => {
    await registerVisit("u1", at("2026-07-11"));
    const read = await getProgress("u1");
    expect(read).toMatchObject({ streak: 1, stars: 5 });
  });
});

describe("buyCharacter", () => {
  const owner = {
    streak: 5,
    lastVisitDate: "2026-07-11",
    stars: 100,
    ownedCharacters: ["tomely", "sprout", "bubbles"],
  };

  it("spends stars and unlocks the character", async () => {
    seed("u1", owner);
    const state = await buyCharacter("u1", "cap");
    expect(state.stars).toBe(70); // 100 - 30
    expect(state.ownedCharacters).toContain("cap");
  });

  it("rejects when the player can't afford it", async () => {
    seed("u1", { ...owner, stars: 10 });
    await expect(buyCharacter("u1", "cap")).rejects.toThrow(/Not enough stars/);
  });

  it("rejects buying an already-owned character", async () => {
    seed("u1", { ...owner, ownedCharacters: [...owner.ownedCharacters, "cap"] });
    await expect(buyCharacter("u1", "cap")).rejects.toThrow(/already owned/);
  });

  it("rejects characters that are not for sale", async () => {
    seed("u1", owner);
    await expect(buyCharacter("u1", "luna")).rejects.toThrow(/not for sale/);
  });
});
