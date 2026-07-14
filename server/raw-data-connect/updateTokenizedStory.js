const connectTokenizedStories =
  require("../config/dataConnectConfig");

const updateTokenizedStory = async (
  storyId,
  story
) => {

  const db =
    await connectTokenizedStories();

  const collection =
    db.collection("tokenized_stories");

  await collection.updateOne(
    {
      _id: storyId,
    },
    {
      $set: {

        storyMoral:
          story.storyMoral,

        transliteratedVersion:
          story.transliteratedVersion,

        sanskritVersion:
          story.sanskritVersion,

        tokenized_english_version:
          story.tokenized_english_version,

        tokenized_sanskrit_version:
          story.tokenized_sanskrit_version,

      },
    }
  );

  return collection.findOne({
    _id: storyId,
  });

};

module.exports =
  updateTokenizedStory;