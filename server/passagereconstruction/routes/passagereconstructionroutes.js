const express = require("express");
const passageReconstructionRouter = express.Router();

const { getGame } = require("../controller/passagereconstructioncontroller");
const {
  submitScore,
  getLeaderboard,
} = require("../controller/passageReconstructionScoreController");

passageReconstructionRouter.get("/game", getGame);

// Save a completed run (only kept if it beats the player's stored best)
passageReconstructionRouter.post("/score", submitScore);

// Top players (?limit=x, default 10, max 100)
passageReconstructionRouter.get("/leaderboard", getLeaderboard);

module.exports = passageReconstructionRouter;
