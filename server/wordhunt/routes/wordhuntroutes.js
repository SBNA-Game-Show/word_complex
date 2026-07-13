const express = require("express");
const wordHuntRouter = express.Router();

const {
  findPOSEnglish,
  findPOSSanskrit,
} = require("../controller/wordhuntcontroller");


const {
  getWordHuntLeaderboard,
  getPlayerRank,
  getLeaderboardStats,
} = require("../controller/wordhuntLeaderboardController");

// API Routes
wordHuntRouter.get("/POSEnglish", findPOSEnglish);
wordHuntRouter.get("/POSSanskrit", findPOSSanskrit);

// Leaderboard Routes
wordHuntRouter.get("/leaderboard", getWordHuntLeaderboard);

wordHuntRouter.get(
  "/leaderboard/stats",
  getLeaderboardStats
);

wordHuntRouter.get(
  "/leaderboard/player/:playerName",
  getPlayerRank
);

// GAME ROUTES

module.exports = wordHuntRouter;