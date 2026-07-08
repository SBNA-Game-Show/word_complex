const express = require("express");
const storySetsRouter = express.Router();

const {
  listSets,
  createSet,
  deleteSet,
  activateSet,
} = require("../controller/storySetsController");

// Sets are immutable — no update route. "Editing" = create new + activate + delete old.
storySetsRouter.get("/", listSets);
storySetsRouter.post("/", createSet);
storySetsRouter.put("/active", activateSet);
storySetsRouter.delete("/:setId", deleteSet);

module.exports = storySetsRouter;
