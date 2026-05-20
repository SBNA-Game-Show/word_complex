const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    password: {
      type: String,
      select: false,
      required: function () {
        return this.role === "ADMIN";
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
