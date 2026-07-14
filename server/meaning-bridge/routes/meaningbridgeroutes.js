const express = require("express");
const {
  getMeaningBridgeHealth,
  generateMeaningBridgeRound,
  submitMeaningBridgeScore,
  getMeaningBridgeLeaderboard,
  saveMeaningBridgeBestScore,
  getMeaningBridgeGlobalLeaderboard,
} = require("../controller/meaningbridgecontroller");

const meaningBridgeRouter = express.Router();

meaningBridgeRouter.get("/health", getMeaningBridgeHealth);
meaningBridgeRouter.post("/generate", generateMeaningBridgeRound);
meaningBridgeRouter.post("/submit", submitMeaningBridgeScore);
meaningBridgeRouter.get("/leaderboard", getMeaningBridgeLeaderboard);

// `meaning-bridge` collection (MongoDB): one doc per player (uuid),
// highest attempt only. POST saves a finished session; GET reads the
// persistent leaderboard.
meaningBridgeRouter.post("/score", saveMeaningBridgeBestScore);
meaningBridgeRouter.get("/score/leaderboard", getMeaningBridgeGlobalLeaderboard);

module.exports = meaningBridgeRouter;
