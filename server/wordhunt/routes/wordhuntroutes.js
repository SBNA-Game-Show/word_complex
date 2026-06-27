const express = require("express");
const wordHuntRouter = express.Router();

const {
  findPOSEnglish,
  findPOSSanskrit,
} = require("../controller/wordhuntcontroller");

//API Routes
wordHuntRouter.get("/POSEnglish", findPOSEnglish);
wordHuntRouter.get("/POSSanskrit", findPOSSanskrit);

module.exports = wordHuntRouter;
