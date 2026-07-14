/**
 * progressService.js
 * --------------------------------------------------------------------------
 * The only write path into a player's streak progress. All streak math lives
 * in progressLogic (pure); this layer just loads the document, applies the
 * decision, and persists it with an upsert — so a brand-new player's doc is
 * created on their first visit (or purchase).
 *
 *   getProgress(uid)                 -> current state (no mutation)
 *   registerVisit(uid)               -> advance streak + award today's stars
 *   buyCharacter(uid, characterId)   -> spend stars to unlock a character
 *
 * Every operation is scoped to a single document by { _id: uid } in the
 * `progress` collection; nothing else in the database is touched.
 * --------------------------------------------------------------------------
 */

const { getProgressCollection } = require("../db/progressCollection");
const { evaluateVisit } = require("../progressLogic");
const { FREE_CHARACTERS, CHARACTER_PRICES } = require("../progressConfig");

/** A client-caused error (bad input, not enough stars, …) → HTTP 400. */
const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

const assertUid = (uid) => {
  if (!uid || typeof uid !== "string") {
    throw badRequest("uid is required and must be a string");
  }
};

/** The starting state for a player we've never seen before. */
const defaultProgress = (uid) => ({
  _id: uid,
  streak: 0,
  lastVisitDate: null,
  stars: 0,
  ownedCharacters: [...FREE_CHARACTERS],
});

/** Load a player's doc, or an in-memory default if they have none yet. */
const loadOrInit = async (collection, uid) => {
  const existing = await collection.findOne({ _id: uid });
  return existing ?? defaultProgress(uid);
};

/** The subset of a document the client cares about (drops _id). */
const toPublicState = ({ streak, stars, ownedCharacters, lastVisitDate }) => ({
  streak,
  stars,
  ownedCharacters,
  lastVisitDate,
});

const getProgress = async (uid) => {
  assertUid(uid);
  const collection = await getProgressCollection();
  const current = await loadOrInit(collection, uid);
  return toPublicState(current);
};

const registerVisit = async (uid, now = new Date()) => {
  assertUid(uid);
  const collection = await getProgressCollection();
  const current = await loadOrInit(collection, uid);

  const visit = evaluateVisit({
    lastVisitDate: current.lastVisitDate,
    currentStreak: current.streak,
    now,
  });

  // Only gift milestone characters the player doesn't already own.
  const newGifts = visit.giftedCharacters.filter(
    (id) => !current.ownedCharacters.includes(id),
  );

  const next = {
    streak: visit.streak,
    lastVisitDate: visit.lastVisitDate,
    stars: current.stars + visit.awardedStars,
    ownedCharacters: [...current.ownedCharacters, ...newGifts],
    updatedAt: new Date(),
  };

  await collection.updateOne({ _id: uid }, { $set: next }, { upsert: true });

  return {
    ...toPublicState(next),
    // What just happened, so the client can celebrate it.
    awardedStars: visit.awardedStars,
    isNewDay: visit.isNewDay,
    giftedCharacters: newGifts,
  };
};

const buyCharacter = async (uid, characterId) => {
  assertUid(uid);

  const price = CHARACTER_PRICES[characterId];
  if (price === undefined) {
    throw badRequest(`Character "${characterId}" is not for sale`);
  }

  const collection = await getProgressCollection();
  const current = await loadOrInit(collection, uid);

  if (current.ownedCharacters.includes(characterId)) {
    throw badRequest("Character already owned");
  }
  if (current.stars < price) {
    throw badRequest("Not enough stars to buy this character");
  }

  const next = {
    stars: current.stars - price,
    ownedCharacters: [...current.ownedCharacters, characterId],
    // Preserve streak fields so an upsert of a brand-new doc stays consistent.
    streak: current.streak,
    lastVisitDate: current.lastVisitDate,
    updatedAt: new Date(),
  };

  await collection.updateOne({ _id: uid }, { $set: next }, { upsert: true });

  return toPublicState(next);
};

module.exports = { getProgress, registerVisit, buyCharacter, defaultProgress };
