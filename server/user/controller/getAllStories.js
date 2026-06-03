const getAllStories = require("../../data-connect/retreiveAllTokenizedStories");
const getAll = async (req, res) => {
  const response = await getAllStories();

  return res.status(200).json({
    success: true,
    data: response,
  });
};

module.exports = getAll;
