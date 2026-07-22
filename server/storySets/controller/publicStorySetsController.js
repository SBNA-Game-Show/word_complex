/**
 * Public, read-only Story Set handlers.
 *
 * Players need the active set ID to associate Word Hunt progress with the
 * current game. This exposes only that pointer; all Story Set listing and
 * mutation routes remain protected by requireAdmin.
 */
const service = require("../storySetsService");

async function getActiveSet(req, res) {
  try {
    const setId = await service.getActiveSetId();

    if (!setId) {
      return res.status(404).json({
        success: false,
        message: "No active story set found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { setId },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = { getActiveSet };
