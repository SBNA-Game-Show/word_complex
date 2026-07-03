/**
 * activeStoriesConfig.js
 * ----------------------
 * Temporary source of truth for which stories players may choose from on the
 * story picker screen.
 *
 * For now this is a static list of story IDs. In a later phase this file will be
 * backed by a DB collection + an admin HTTP API (the admin page will set the
 * active stories). Everything downstream depends only on getActiveStoryIds(), so
 * that swap can happen here without touching any callers.
 */

const ACTIVE_STORY_IDS = [
  "04e9ae48-5570-4cd0-8968-a2179353164b",
  "73a1ae3b-3c35-414b-8f9d-e4e241fe49e1",
  "64980961-31e5-4794-a104-54807f6e96d0",
  "f535b7bc-3ea6-4085-9b0a-f42499c90d2b",
];

const getActiveStoryIds = () => [...ACTIVE_STORY_IDS];

module.exports = { getActiveStoryIds, ACTIVE_STORY_IDS };
