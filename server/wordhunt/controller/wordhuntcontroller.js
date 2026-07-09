const findNounVerbAndAdjEnglish = require("../service/findNounsVerbsAndAdjectivesGameEnglish");
const findNounVerbAndAdjSanskrit = require("../service/findNounsVerbsAndAdjectivesGameSanskrit");

const findPOSEnglish = async (req, res) => {
  try {
    const { storyId } = req.query;

    if (!storyId) {
      return res.status(400).json({
        success: false,
        message: "storyId is required",
      });
    }

    const story = await findNounVerbAndAdjEnglish(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "No Story Available By Given Id",
      });
    }

    return res.status(200).json({
      success: true,
      data: story,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const findPOSSanskrit = async (req, res) => {
  try {
    const { storyId } = req.query;

    if (!storyId) {
      return res.status(400).json({
        success: false,
        message: "storyId is required",
      });
    }

    const story = await findNounVerbAndAdjSanskrit(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "No Story Available By Given Id",
      });
    }

    return res.status(200).json({
      success: true,
      data: story,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { findPOSEnglish, findPOSSanskrit };
