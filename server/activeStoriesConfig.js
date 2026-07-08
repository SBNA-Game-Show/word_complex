/**
 * activeStoriesConfig.js
 * ----------------------
 * FALLBACK + SEED ONLY (as of 2026-07-07). The live source of truth is the
 * `storySets` collection, read via storySets/storySetsService.getActiveStoryIds()
 * (admin write API: /api/v1/admin/storySets).
 *
 * This static list is used in exactly two places:
 *   1. storySetsService falls back to it if the DB has no active set (or the
 *      read fails), so the picker can never come up empty.
 *   2. scripts/seedStorySets.js seeds the first story set from it.
 *
 * Do NOT import this from controllers — go through storySetsService.
 */
const ACTIVE_STORY_IDS = [
  "04e9ae48-5570-4cd0-8968-a2179353164b",
  "73a1ae3b-3c35-414b-8f9d-e4e241fe49e1",
  "64980961-31e5-4794-a104-54807f6e96d0",
  "f535b7bc-3ea6-4085-9b0a-f42499c90d2b",
];

const getActiveStoryIds = () => [...ACTIVE_STORY_IDS];

module.exports = { getActiveStoryIds, ACTIVE_STORY_IDS };
