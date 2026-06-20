/**
 * explore-stories.js
 * Run with: node explore-stories.js
 *
 * Just pulls one story from MongoDB and prints it in a readable way.
 * Nothing is changed. Read-only exploration.
 */

require("dotenv").config();
const { MongoClient } = require("mongodb");

const ATLAS_URI = process.env.ATLAS_URI;

async function explore() {
  const client = new MongoClient(ATLAS_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db("word_complex");
    const collection = db.collection("tokenized_stories");

    // How many stories do we have?
    const total = await collection.countDocuments();
    console.log(`📚 Total stories in collection: ${total}\n`);

    // Pull one story
    const story = await collection.findOne({});

    if (!story) {
      console.log("❌ No stories found in collection.");
      return;
    }

    // Top level fields
    console.log("=== TOP LEVEL FIELDS ===");
    console.log("_id         :", story._id);
    console.log("category    :", story.category);
    console.log("storyMoral  :", story.storyMoral);
    console.log("title       :", JSON.stringify(story.title));
    console.log("englishVersion (first 150 chars):", story.englishVersion?.slice(0, 150));

    // Sanskrit sentences
    console.log("\n=== SANSKRIT VERSION (first 3 sentences) ===");
    story.sanskritVersion?.slice(0, 3).forEach((s, i) => {
      console.log(`  [${i}] ${s}`);
    });

    // Transliterated sentences
    console.log("\n=== TRANSLITERATED VERSION (first 3 sentences) ===");
    story.transliteratedVersion?.slice(0, 3).forEach((s, i) => {
      console.log(`  [${i}] ${s}`);
    });

    // Sanskrit tokens — first sentence, first 3 tokens
    console.log("\n=== SANSKRIT TOKENS — sentence[0], first 3 tokens ===");
    story.tokenized_sanskrit_version?.[0]?.slice(0, 3).forEach((token, i) => {
      console.log(`  token[${i}]:`, JSON.stringify(token));
    });

    // English tokens — first 5
    console.log("\n=== ENGLISH TOKENS — first 5 ===");
    story.tokenized_english_version?.slice(0, 5).forEach((token, i) => {
      console.log(`  token[${i}]:`, JSON.stringify(token));
    });

    // Actors
    console.log("\n=== ACTORS ===");
    console.log(JSON.stringify(story.actors, null, 2));

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
    console.log("\n🔌 Connection closed.");
  }
}

explore();
