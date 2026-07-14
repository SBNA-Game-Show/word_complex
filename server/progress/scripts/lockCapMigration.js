/**
 * One-off migration: Cap used to be a free default and is now a paid character.
 * Accounts created before that change have "cap" baked into ownedCharacters, so
 * it shows as unlocked for free. Cap was never purchasable before this change,
 * so any stored "cap" is a leftover freebie — pull it from every progress doc.
 *
 * Run once:  node progress/scripts/lockCapMigration.js
 */

const connectWordComplex = require("../../config/dataConnectConfig");
const { COLLECTION_NAME } = require("../progressConfig");

(async () => {
  const db = await connectWordComplex();
  const result = await db
    .collection(COLLECTION_NAME)
    .updateMany({ ownedCharacters: "cap" }, { $pull: { ownedCharacters: "cap" } });

  console.log(`Updated ${result.modifiedCount} progress document(s).`);
  await connectWordComplex.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
