const express = require("express");
const request = require("supertest");

// Mock the Admin SDK wrapper so no real Firebase credentials/network are needed.
jest.mock("../config/firebaseAdmin", () => ({
  getAdminAuth: jest.fn(),
  getAdminFirestore: jest.fn(),
}));

const { getAdminAuth, getAdminFirestore } = require("../config/firebaseAdmin");
const requireAdmin = require("./requireAdmin");

// Point verifyIdToken at a fixed decoded token (or make it throw).
function mockVerify({ resolves, rejects } = {}) {
  getAdminAuth.mockReturnValue({
    verifyIdToken: jest.fn(() =>
      rejects ? Promise.reject(new Error("bad token")) : Promise.resolve(resolves),
    ),
  });
}

// Point the Firestore read at a snapshot (or make .get() throw).
function mockFirestore({ snapshot, rejects } = {}) {
  getAdminFirestore.mockReturnValue({
    doc: jest.fn(() => ({
      get: jest.fn(() =>
        rejects ? Promise.reject(new Error("firestore down")) : Promise.resolve(snapshot),
      ),
    })),
  });
}

function buildApp() {
  const app = express();
  app.get("/protected", requireAdmin, (req, res) =>
    res.status(200).json({ ok: true, uid: req.adminUser?.uid }),
  );
  return app;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("requireAdmin middleware", () => {
  it("401s when the Authorization header is missing", async () => {
    await request(buildApp()).get("/protected").expect(401);
    expect(getAdminAuth).not.toHaveBeenCalled();
  });

  it("401s when the header is not a Bearer token", async () => {
    await request(buildApp())
      .get("/protected")
      .set("Authorization", "Basic abc123")
      .expect(401);
  });

  it("401s when the token fails verification", async () => {
    mockVerify({ rejects: true });

    await request(buildApp())
      .get("/protected")
      .set("Authorization", "Bearer invalid")
      .expect(401);
  });

  it("403s when the user is authenticated but not an admin", async () => {
    mockVerify({ resolves: { uid: "u1", email: "reader@example.com" } });
    mockFirestore({ snapshot: { exists: true, data: () => ({ isAdmin: false }) } });

    await request(buildApp())
      .get("/protected")
      .set("Authorization", "Bearer good")
      .expect(403);
  });

  it("403s when the user has no account doc", async () => {
    mockVerify({ resolves: { uid: "u1" } });
    mockFirestore({ snapshot: { exists: false, data: () => undefined } });

    await request(buildApp())
      .get("/protected")
      .set("Authorization", "Bearer good")
      .expect(403);
  });

  it("passes through (200) and attaches req.adminUser for an admin", async () => {
    mockVerify({ resolves: { uid: "admin-1", email: "admin@example.com" } });
    mockFirestore({ snapshot: { exists: true, data: () => ({ isAdmin: true }) } });

    const res = await request(buildApp())
      .get("/protected")
      .set("Authorization", "Bearer good")
      .expect(200);

    expect(res.body).toEqual({ ok: true, uid: "admin-1" });
  });

  it("500s when the admin check itself fails", async () => {
    mockVerify({ resolves: { uid: "u1" } });
    mockFirestore({ rejects: true });

    await request(buildApp())
      .get("/protected")
      .set("Authorization", "Bearer good")
      .expect(500);
  });
});
