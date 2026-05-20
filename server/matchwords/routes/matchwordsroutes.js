const express = require("express");
const matchWordsRouter = express.Router();

const { initializeGame } = require("../controller/matchwordscontroller");

matchWordsRouter.get("/", initializeGame);

module.exports = matchWordsRouter;
