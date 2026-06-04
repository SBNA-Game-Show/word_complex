const express = require("express");
const wordHuntRouter = express.Router();

const findPOSEnglish = require("../controller/wordhuntcontroller");

//API Routes
wordHuntRouter.get("/POSEnglish", findPOSEnglish);

module.exports = wordHuntRouter;
