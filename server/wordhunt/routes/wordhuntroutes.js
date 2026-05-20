const express = require("express");
const wordHuntRouter = express.Router();

const { initializeGame } = require("../controller/wordhuntcontroller");

//API Routes
wordHuntRouter.get("/", initializeGame);

module.exports = wordHuntRouter;
