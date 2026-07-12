const connectToDatabase = require("../../config/dataConnectConfig");

async function getContextClozeQuestCollection() {
  const db = await connectToDatabase();
  return db.collection("context_cloze_quest");
}

module.exports = { getContextClozeQuestCollection };