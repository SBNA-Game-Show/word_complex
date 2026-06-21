const app = require("./app");
const connectDB = require("./config/dbConfig");
const ENV = require("./config/envconfig");

(async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed");
    console.error("⚠️  Server starting without MongoDB — some routes may not work.");
  }

  app.listen(ENV.PORT, () => {
    console.log(`Backend listening on port ${ENV.PORT}`);
  });
})();
