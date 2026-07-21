require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");

const ATLAS_URI = process.env.ATLAS_URI;

if (!ATLAS_URI) {
  throw new Error("❌ ATLAS_URI is missing in environment variables");
}

const client = new MongoClient(ATLAS_URI);

let db;

const connectTokenizedStories = async () => {
  if (db) return db;

  await client.connect();
  console.log("✅ MongoDB Connected");

  db = client.db("word_complex");
  return db;
};

connectTokenizedStories.close = async () => {
  if (!db) return;
  await client.close();
  db = undefined;
};

module.exports = connectTokenizedStories;
