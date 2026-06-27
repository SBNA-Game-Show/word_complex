const express = require("express");
const { getMeaningBridgeHealth, generateMeaningBridgeRound } = require("../controller/meaningbridgecontroller");

const meaningBridgeRouter = express.Router();

meaningBridgeRouter.get("/health", getMeaningBridgeHealth);
meaningBridgeRouter.post("/generate", generateMeaningBridgeRound);

// Removed for v1 (simple game — no server-side scoring needed):
// POST /submit     — server-side round scoring (add back when leaderboard is built)
// GET  /leaderboard — player rankings (add back in v2)

module.exports = meaningBridgeRouter;
