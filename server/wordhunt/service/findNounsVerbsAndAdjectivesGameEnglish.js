const retrieveStoryById = require("../../raw-data-connect/retrieveTokenizedStoryById");

const findNounVerbAndAdjEnglish = async (storyId) => {
  if (!storyId) {
    throw new Error("Story Id is missing");
  }
  //step:1 Get tokenized story by Id
  const story = await getStroyById(storyId);

  // step:2 extract english version and tokenized_english_version
  const data = extractRequiredData(story);
  // step:3 break the english version into array for display
  const revisedData = breakPassageToArray(data);
  // step:4 clean the tokenized array to remove all empty

  const cleanedData = cleanTokenizedArray(revisedData);

  // step:5 return processed data for frontend

  return cleanedData;
};

const getStroyById = async (storyId) => {
  const story = await retrieveStoryById(storyId);

  return story;
};

const extractRequiredData = (data) => {
  if (!data) {
    throw new Error("Story data not found");
  }

  return {
    passage: data.englishVersion,
    tokenizedPassage: data.tokenized_english_version,
  };
};

const breakPassageToArray = (data) => {
  if (!data) {
    throw new Error("Data Not available to change the passage to Array");
  }

  const passage = data.passage;

  if (!passage) {
    throw new Error("Passage is missing for changing to an array");
  }

  const passageArray = passage.match(/\w+|[.,!?;:]/g);

  return {
    passage: data.passage,
    tokenizedPassage: data.tokenizedPassage,
    passageArray: passageArray,
  };
};

const cleanTokenizedArray = (data) => {
  if (!data) {
    throw new Error("Data Not Available to Clean Tokenized Array");
  }

  const tokenizedArray = data.tokenizedPassage;

  if (!tokenizedArray || tokenizedArray.length === 0) {
    throw new Error("Tokenized Passage not Available");
  }

  const cleanedTokenizedArray = tokenizedArray.map((token) => {
    const { synonyms, antonyms, ...cleanedToken } = token;
    return cleanedToken;
  });

  return {
    passage: data.passage,
    tokenizedPassage: cleanedTokenizedArray,
    passageArray: data.passageArray,
  };
};

module.exports = findNounVerbAndAdjEnglish;
