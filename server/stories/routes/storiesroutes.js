const express = require("express");
const storiesRouter = express.Router();

const {
  getActiveStories,
  getAllTokenizedStories,
  updateTokenizedStory,
} = require("../controller/storiescontroller");

// Story Picker
storiesRouter.get("/active", getActiveStories);

// Tokenized Story Editor
storiesRouter.get("/tokenized", getAllTokenizedStories);

storiesRouter.put( "/tokenized/:id",  updateTokenizedStory);

module.exports = storiesRouter;