require("dotenv").config();

const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI:
    process.env.NODE_ENV === "production"
      ? process.env.ATLAS_URI
      : process.env.MONGO_URI,
};

module.exports = ENV;
