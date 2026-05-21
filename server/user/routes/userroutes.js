const express = require("express");
const userRouter = express.Router();

const registerUser = require("../controller/registeruser");
const deleteUser = require("../controller/deleteuser");
const requireAdmin = require("../../middleware/requireAdmin");

userRouter.post("/register", registerUser);
userRouter.delete("/remove", requireAdmin, deleteUser);

module.exports = userRouter;
