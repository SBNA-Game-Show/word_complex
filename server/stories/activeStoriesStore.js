// DEPRECATED — superseded by storySets/storySetsService.js (2026-07-07).
//
// This was the Phase-2 scaffold for a single `activeStories` config doc. The
// design changed to admin-versioned story SETS (`storySets` collection + an
// active pointer in `config`), so the real read path now lives in
// storySets/storySetsService.getActiveStoryIds().
//
// Re-exported here only so any stale import keeps working. New code should
// import from ../storySets/storySetsService directly. Delete this file once
// nothing references it.

const { getActiveStoryIds } = require("../storySets/storySetsService");

module.exports = { getActiveStoryIds };
