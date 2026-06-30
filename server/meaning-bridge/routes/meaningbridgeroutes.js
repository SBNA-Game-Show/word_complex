const express = require("express");
const {
  getMeaningBridgeHealth,
  generateMeaningBridgeRound,
  submitMeaningBridgeScore,
  getMeaningBridgeLeaderboard,
} = require("../controller/meaningbridgecontroller");

const meaningBridgeRouter = express.Router();

meaningBridgeRouter.get("/health", getMeaningBridgeHealth);
meaningBridgeRouter.post("/generate", generateMeaningBridgeRound);
meaningBridgeRouter.post("/submit", submitMeaningBridgeScore);
meaningBridgeRouter.get("/leaderboard", getMeaningBridgeLeaderboard);

module.exports = meaningBridgeRouter;
