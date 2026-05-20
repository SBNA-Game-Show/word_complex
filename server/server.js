const express = require("express");
const cors = require("cors");
const connectDB = require("./config/dbConfig");
const ENV = require("./config/envconfig");

//Routes Import
const userRouter = require("./user/routes/userroutes");
const fillInBlanks = require("./fillinblanks/routes/fillinblanksroutes");
const matchWords = require("./matchwords/routes/matchwordsroutes");
const passageReconstruction = require("./passagereconstruction/routes/passagereconstructionroutes");
const wordHunt = require("./wordhunt/routes/wordhuntroutes");

const app = express();

// Database Connect
(async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
})();

app.use(express.json());
app.use(cors());

//ROOT

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// API Routes

//user Routes

app.use("/api/v1/user", userRouter);

//Fill in the Blanks Routes
app.use("/api/v1/fillInBlanks", fillInBlanks);

//Match words
app.use("/api/v1/matchWords", matchWords);

//Passage Reconstruction
app.use("/api/v1/passageReconstruct", passageReconstruction);

//WordHunt Routes
app.use("/api/v1/wordHunt", wordHunt);

//server call

app.listen(ENV.PORT, () => {
  console.log(`Backend listening on port ${ENV.PORT}`);
});
