const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Extend timeout for MongoDB binary download
jest.setTimeout(60000);

class DBManager {
  constructor() {
    this.server = null;
    this.db = null;
  }

  async start() {
    // Create in-memory MongoDB
    this.server = await MongoMemoryServer.create();

    // Get Mongo URI
    const uri = this.server.getUri();

    // Connect mongoose
    await mongoose.connect(uri);

    // Store native MongoDB database instance
    this.db = mongoose.connection.db;
  }

  getDb() {
    return this.db;
  }

  async stop() {
    await mongoose.connection.close();

    if (this.server) {
      await this.server.stop();
    }
  }

  async cleanup() {
    if (!this.db) return;

    const collections = await this.db.listCollections().toArray();

    for (const collection of collections) {
      await this.db.collection(collection.name).deleteMany({});
    }
  }
}

module.exports = DBManager;