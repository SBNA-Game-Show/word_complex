const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Extend timeout for MongoDB binary download
jest.setTimeout(60000);

class DBManager {
  constructor() {
    this.server = null;
  }

  async start() {
    // Create in-memory MongoDB
    this.server = await MongoMemoryServer.create();

    // Get Mongo URI
    const uri = this.server.getUri();

    // Connect mongoose
    await mongoose.connect(uri);
  }

  async stop() {
    // Close mongoose connection
    await mongoose.connection.close();

    // Stop memory server
    if (this.server) {
      await this.server.stop();
    }
  }

  async cleanup() {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

module.exports = DBManager;
