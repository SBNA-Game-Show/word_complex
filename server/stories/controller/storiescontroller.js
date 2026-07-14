const { getActiveStoryIds } = require("../../storySets/storySetsService");
const {
  retrieveStoryById,
} = require("../../raw-data-connect/retrieveTokenizedStoryById");
const retrieveAllStories = require("../../raw-data-connect/retrieveAllTokenizedStories");
const updateStory = require("../../raw-data-connect/updateTokenizedStory");

/*
 * Pull a human-readable title out of a tokenized_stories doc.
 */
function resolveTitle(story) {
  const title = story?.title;

  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }

  if (title && typeof title === "object") {
    return (
      title.english ||
      title.en ||
      Object.values(title).find(Boolean) ||
      story._id
    );
  }

  return story?.category || story?._id;
}

/*
 * GET /api/v1/stories/active
 * Returns the admin-selected stories (titles only).
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
      })
    );

    return res.status(200).json({
      success: true,
      data: stories.filter(Boolean),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * GET /api/v1/stories/tokenized
 * Returns all tokenized stories.
 */
const getAllTokenizedStories = async (req, res) => {
  try {
    const stories = await retrieveAllStories();

    return res.status(200).json({
      success: true,
      data: stories,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * PUT /api/v1/stories/tokenized/:id
 * Updates editable fields of a tokenized story.
 */
const updateTokenizedStory = async (req, res) => {
  try {
    const updatedStory = await updateStory(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      data: updatedStory,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getActiveStories,
  getAllTokenizedStories,
  updateTokenizedStory,
};