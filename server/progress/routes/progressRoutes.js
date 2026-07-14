/**
 * progressRoutes.js
 * --------------------------------------------------------------------------
 * Daily-streak routes, mounted at /api/v1/progress in app.js.
 * --------------------------------------------------------------------------
 */

const express = require("express");
const progressRouter = express.Router();

const {
  getProgressController,
  getConfigController,
  registerVisitController,
  buyCharacterController,
} = require("../controller/progressController");

// GET  /api/v1/progress?uid=<firebaseUid>
progressRouter.get("/", getProgressController);

// GET  /api/v1/progress/config
progressRouter.get("/config", getConfigController);

// POST /api/v1/progress/visit  { uid }
progressRouter.post("/visit", registerVisitController);

// POST /api/v1/progress/buy    { uid, characterId }
progressRouter.post("/buy", buyCharacterController);

module.exports = progressRouter;
