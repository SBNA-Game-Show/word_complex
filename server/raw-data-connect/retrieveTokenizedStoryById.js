// Need to call this method
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

const retrieveRandomStory = async () => {
  const db = await connectTokenizedStories();

  const results = await db
    .collection("tokenized_stories")
    .aggregate([{ $sample: { size: 1 } }])
    .toArray();

  if (!results.length) {
    throw new Error("No stories found in collection");
  }

  return results[0];
};

module.exports = { retrieveStoryById, retrieveRandomStory };
