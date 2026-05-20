const mongoose = require("mongoose");
const ENV = require("./envconfig");

const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error);

    process.exit(1);
  }
};

module.exports = connectDB;
