// Runs after the test framework is set up, for every test suite.
// Closes the shared MongoDB Atlas client so an open connection pool
// can never keep Jest alive and hang the test run.
afterAll(async () => {
  try {
    const connectTokenizedStories = require("./config/dataConnectConfig");
    if (typeof connectTokenizedStories.close === "function") {
      await connectTokenizedStories.close();
    }
  } catch {
    // Module may be mocked or not loaded in this suite — nothing to close.
  }
});
