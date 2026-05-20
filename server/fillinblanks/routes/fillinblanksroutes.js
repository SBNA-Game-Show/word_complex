const express = require("express");
const fillInBlanksRouter = express.Router();

const { initializeGame } = require("../controller/fillinblankscontroller");

//API Routes

fillInBlanksRouter.get("/", initializeGame);

module.exports = fillInBlanksRouter;
