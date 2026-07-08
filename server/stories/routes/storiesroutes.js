const express = require("express");
const storiesRouter = express.Router();

const { getActiveStories } = require("../controller/storiescontroller");

// Public read: the story picker fetches the admin-selected stories from here.
storiesRouter.get("/active", getActiveStories);

module.exports = storiesRouter;
