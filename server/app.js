const express = require("express");
const cors = require("cors");
const path = require("path");

// Routes
const fillInBlanks = require("./fillinblanks/routes/fillinblanksroutes");
const matchWords = require("./matchwords/routes/matchwordsroutes");
const passageReconstruction = require("./passagereconstruction/routes/passagereconstructionroutes");
const wordHunt = require("./wordhunt/routes/wordhuntroutes");
const meaningBridge = require("./meaning-bridge/routes/meaningbridgeroutes");
const leaderboard = require("./leaderboard/routes/leaderboardRoutes");

const app = express();

app.use(express.json());
app.use(cors());

// ROOT
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Routes
app.use("/api/v1/fillInBlanks", fillInBlanks);
app.use("/api/v1/matchWords", matchWords);
app.use("/api/v1/passageReconstruct", passageReconstruction);
app.use("/api/v1/wordHunt", wordHunt);
app.use("/api/v1/meaningBridge", meaningBridge);
app.use("/api/v1/leaderboard", leaderboard);

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "./views/404.html"));
});

module.exports = app;
