const connectToDatabase = require("../../config/dataConnectConfig");

async function getPassageReconstructionCollection() {
  const db = await connectToDatabase();
  return db.collection("passage_reconstruction");
}

module.exports = { getPassageReconstructionCollection };
