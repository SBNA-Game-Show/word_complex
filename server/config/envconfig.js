require("dotenv").config({ quiet: true });

const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: process.env.ATLAS_URI,
};

module.exports = ENV;
