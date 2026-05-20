const express = require("express");
const passageReconstructionRouter = express.Router();

const {
  initializeGame,
} = require("../controller/passagereconstructioncontroller");

//API Routes

passageReconstructionRouter.get("/", initializeGame);

module.exports = passageReconstructionRouter;
