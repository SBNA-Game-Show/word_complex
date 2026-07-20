const express = require("express");
const storiesRouter = express.Router();

const requireAdmin = require("../../middleware/requireAdmin");

const {
  getActiveStories,
  getAllTokenizedStories,
  updateTokenizedStory,
} = require("../controller/storiescontroller");

// Story Picker
storiesRouter.get("/active", getActiveStories);

// Tokenized Story Editor
storiesRouter.get("/tokenized", getAllTokenizedStories);

// Editing a tokenized story is an admin action (used by the admin editor).
storiesRouter.put("/tokenized/:id", requireAdmin, updateTokenizedStory);

module.exports = storiesRouter;