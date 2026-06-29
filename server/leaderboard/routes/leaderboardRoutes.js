/**
 * leaderboardRoutes.js
 * --------------------------------------------------------------------------
 * Read routes for the leaderboard, mounted at /api/v1/leaderboard in app.js.
 * --------------------------------------------------------------------------
 */

const express = require("express");
const leaderboardRouter = express.Router();

const {
  getLeaderboardController,
  getPlayerRankController,
} = require("../controller/leaderboardController");

// GET /api/v1/leaderboard?game=master&limit=100
leaderboardRouter.get("/", getLeaderboardController);

// GET /api/v1/leaderboard/rank?uuid=<firebaseUid>&game=master
leaderboardRouter.get("/rank", getPlayerRankController);

module.exports = leaderboardRouter;
