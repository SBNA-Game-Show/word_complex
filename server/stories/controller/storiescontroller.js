const { getActiveStoryIds } = require("../../storySets/storySetsService");
const {
  retrieveStoryById,
} = require("../../raw-data-connect/retrieveTokenizedStoryById");

/*
 * Pull a human-readable title out of a tokenized_stories doc. The `title` field
 * may be a plain string or a localized object, so fall back sensibly rather than
 * rendering "[object Object]" on the picker.
 */
function resolveTitle(story) {
  const title = story?.title;

  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }

  if (title && typeof title === "object") {
    return title.english || title.en || Object.values(title).find(Boolean) || story._id;
  }

  return story?.category || story?._id;
}

/*
 * GET /api/v1/stories/active
 * Returns the admin-selected stories (titles only) for the story picker.
 * A configured id that no longer resolves is skipped rather than failing the
 * whole request, so one bad id can't take down the picker.
 */
const getActiveStories = async (req, res) => {
  try {
    const ids = await getActiveStoryIds();

    const stories = await Promise.all(
      ids.map(async (storyId) => {
        try {
          const story = await retrieveStoryById(storyId);
          return {
            storyId,
            title: resolveTitle(story),
            category: story.category ?? null,
          };
        } catch {
          return null;
        }
      }),
    );

    return res.status(200).json({
      success: true,
      data: stories.filter(Boolean),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getActiveStories };
