const app = require("./app");
const connectDB = require("./config/dbConfig");
const ENV = require("./config/envconfig");

(async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully");

    app.listen(ENV.PORT, () => {
      console.log(`Backend listening on port ${ENV.PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
})();
