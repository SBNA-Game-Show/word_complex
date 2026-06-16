const express = require("express");
const passageReconstructionRouter = express.Router();

const { getGame } = require("../controller/passagereconstructioncontroller");

passageReconstructionRouter.get("/game", getGame);

module.exports = passageReconstructionRouter;
