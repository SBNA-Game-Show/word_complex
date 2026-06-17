const findNounVerbAndAdjEnglish = require("../service/findNounsVerbsAndAdjectivesGameEnglish");

const findPOSEnglish = async (req, res) => {
  try {
    const storyId = "04e9ae48-5570-4cd0-8968-a2179353164b";
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

module.exports = findPOSEnglish;
