const express = require("express");

const {
  getMeaningBridgeHealth,
  generateMeaningBridgeRound,
  submitMeaningBridgeRound,
  getMeaningBridgeLeaderboard,
} = require("../controller/meaningbridgecontroller");

const { requireMeaningBridgeApiKey } = require("../middleware/apikey");

const meaningBridgeRouter = express.Router();

meaningBridgeRouter.get("/health", getMeaningBridgeHealth);

meaningBridgeRouter.post(
  "/generate",
  requireMeaningBridgeApiKey,
  generateMeaningBridgeRound,
);

meaningBridgeRouter.post(
  "/submit",
  requireMeaningBridgeApiKey,
  submitMeaningBridgeRound,
);

meaningBridgeRouter.get(
  "/leaderboard",
  requireMeaningBridgeApiKey,
  getMeaningBridgeLeaderboard,
);

module.exports = meaningBridgeRouter;
