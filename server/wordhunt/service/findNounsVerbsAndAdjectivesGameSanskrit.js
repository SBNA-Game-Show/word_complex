const retrieveStoryById = require("../../raw-data-connect/retrieveTokenizedStoryById");

const findNounVerbAndAdjSanskrit = async (storyId) => {
  if (!storyId) {
    throw new Error("Story Id is missing");
  }

  const story = await getStroyById(storyId);

  const data = extractRequiredData(story);

  return data;
};

const getStroyById = async (storyId) => {
  const story = await retrieveStoryById(storyId);

  return story;
};

const extractRequiredData = (data) => {
  if (!data) {
    throw new Error("Story data not Found");
  }

  return {
    passage: data.sanskritVersion,
    tokenizedPassage: data.tokenized_sanskrit_version,
  };
};

module.exports = findNounVerbAndAdjSanskrit;
