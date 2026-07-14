const express = require("express");
const wordHuntRouter = express.Router();

const {
  findPOSEnglish,
  findPOSSanskrit,
} = require("../controller/wordhuntcontroller");

const {
  initGame,
  getAll,
  addStoryInfo,
  addGameData,
} = require("../controller/gamecontroller");

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

wordHuntRouter.get("/leaderboard/stats", getLeaderboardStats);

wordHuntRouter.get("/leaderboard/player/:playerName", getPlayerRank);

// GAME ROUTES

//POST ROUTES
wordHuntRouter.post("/initGame", initGame);
wordHuntRouter.post("/addStoryInfo", addStoryInfo);
wordHuntRouter.post("/addGameData", addGameData);

//GET ROUTES
wordHuntRouter.get("/allGameData", getAll);

module.exports = wordHuntRouter;
