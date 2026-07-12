const express = require("express");
const fillInBlanksRouter = express.Router();

const { initializeGame } = require(
  "../controller/fillinblankscontroller"
);

const {
  submitScore,
  getLeaderboard,
} = require("../controller/contextClozeQuestScoreController");

// Create a game
fillInBlanksRouter.get("/", initializeGame);

// Save a completed score
fillInBlanksRouter.post("/score", submitScore);

// Get the 10 best players
fillInBlanksRouter.get("/leaderboard", getLeaderboard);

module.exports = fillInBlanksRouter;