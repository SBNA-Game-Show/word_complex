const connectTokenizedStories = require("../config/dataConnectConfig");
const retrieveStoryById = async (storyId) => {
  if (!storyId) {
    throw new Error("Story Id is Required");
  }

  const db = await connectTokenizedStories();

  const story = await db
    .collection("tokenized_stories")
    .findOne({ _id: storyId });

  if (!story) {
    throw new Error("No Tokenized story found by given Id");
  }

  return story;
};
module.exports = retrieveStoryById;
