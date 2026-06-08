const mongoose = require("mongoose");
const ENV = require("./envconfig");

const connectDB = async () => {
  await mongoose.connect(ENV.MONGO_URI);
  console.log("✅ MongoDB Connected");
};

module.exports = connectDB;
