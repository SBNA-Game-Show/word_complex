/**
 * progressController.js
 * --------------------------------------------------------------------------
 * HTTP handlers for the daily-streak feature.
 *
 *   GET  /api/v1/progress?uid=<firebaseUid>   -> current state (read only)
 *   GET  /api/v1/progress/config              -> static economy config
 *   POST /api/v1/progress/visit  { uid }      -> advance streak + award stars
 *   POST /api/v1/progress/buy    { uid, characterId } -> unlock a character
 *
 * Service errors carry a `.status` (400 for client mistakes); everything else
 * is treated as a 500.
 * --------------------------------------------------------------------------
 */

const {
  getProgress,
  registerVisit,
  buyCharacter,
} = require("../service/progressService");
const { buildRewardLadder } = require("../progressLogic");
const {
  MILESTONE_GIFTS,
  CHARACTER_PRICES,
  FREE_CHARACTERS,
} = require("../progressConfig");

const respondWithError = (res, error) =>
  res
    .status(error.status ?? 500)
    .json({ success: false, message: error.message });

const getProgressController = async (req, res) => {
  try {
    const data = await getProgress(req.query.uid);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error);
  }
};

// Static — lets the client render the ladder, prices, and gifts without
// duplicating the economy numbers that the server owns.
const getConfigController = (_req, res) =>
  res.status(200).json({
    success: true,
    data: {
      ladder: buildRewardLadder(),
      milestones: MILESTONE_GIFTS,
      prices: CHARACTER_PRICES,
      freeCharacters: FREE_CHARACTERS,
    },
  });

const registerVisitController = async (req, res) => {
  try {
    const data = await registerVisit(req.body.uid);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error);
  }
};

const buyCharacterController = async (req, res) => {
  try {
    const { uid, characterId } = req.body;
    const data = await buyCharacter(uid, characterId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error);
  }
};

module.exports = {
  getProgressController,
  getConfigController,
  registerVisitController,
  buyCharacterController,
};
