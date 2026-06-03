const connectTokenizedStories = require("../config/dataConnectConfig");
/***
 *
 * The following class connects to the tokenized stories collection and retrieves
 * all the tokenized stories in collection.
 */

const retrieveAllStories = async () => {
  try {
    const db = await connectTokenizedStories();
    const tokenized_stories = await db.collection("tokenized_stories");

    const stories = await tokenized_stories.find({}).toArray();
    // console.log("Get All Stories: ", stories);

    if (stories.length === 0) {
      return [];
    }

    return stories;
  } catch (error) {
    console.error("Error retrieving stories:", error);
    throw error;
  }
};

module.exports = retrieveAllStories;
