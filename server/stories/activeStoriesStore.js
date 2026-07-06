// Phase 2 scaffold — Mongo-backed READ accessor for the admin-selected stories.
//
// The admin page owns the WRITE side (it will set the activeStories doc), so
// there is deliberately no setActiveStoryIds here. This file only needs the READ
// side so the story picker can pull whatever the admin last saved.
//
// NOT wired up yet: the live read path still uses the static list in
// activeStoriesConfig.js. When the admin page is writing the `activeStories`
// collection, fill in the body below and point stories/controller at this getter.

async function getActiveStoryIds() {
  // const connectTokenizedStories = require("../config/dataConnectConfig");
  // const { getActiveStoryIds: getDefaultActiveStoryIds } = require("../activeStoriesConfig");
  //
  // const db = await connectTokenizedStories();
  // const config = await db
  //   .collection("activeStories")
  //   .findOne({ _id: "activeStories" });
  //
  // // Before the admin has ever saved a set, seed from the static default so the
  // // picker is never empty on first run.
  // if (!config || !Array.isArray(config.storyIds) || config.storyIds.length === 0) {
  //   return getDefaultActiveStoryIds();
  // }
  //
  // return config.storyIds;
}

module.exports = { getActiveStoryIds };
