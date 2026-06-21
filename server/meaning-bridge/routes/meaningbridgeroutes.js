const express = require("express");

const {
  getMeaningBridgeHealth,
  generateMeaningBridgeRound,
  generateSentenceMatchRound,
  submitMeaningBridgeRound,
  getMeaningBridgeLeaderboard,
  debugStoryStructure,
} = require("../controller/meaningbridgecontroller");

const { requireMeaningBridgeApiKey } = require("../middleware/apikey");

const meaningBridgeRouter = express.Router();

meaningBridgeRouter.get("/health", getMeaningBridgeHealth);

// Debug endpoint - returns raw story from MongoDB so we can inspect token field names
meaningBridgeRouter.get("/debug-story", debugStoryStructure);

meaningBridgeRouter.post("/generate", requireMeaningBridgeApiKey, generateMeaningBridgeRound);

meaningBridgeRouter.post("/generate-sentence", requireMeaningBridgeApiKey, generateSentenceMatchRound);

meaningBridgeRouter.post("/submit", requireMeaningBridgeApiKey, submitMeaningBridgeRound);

meaningBridgeRouter.get("/leaderboard", requireMeaningBridgeApiKey, getMeaningBridgeLeaderboard);

module.exports = meaningBridgeRouter;
