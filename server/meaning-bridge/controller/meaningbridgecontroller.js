const { generateSynonymMatchPuzzle, generateAntonymMatchPuzzle, generateDefinitionMatchPuzzle } = require("../service/generatepuzzle");
const { retrieveStoryById } = require("../../raw-data-connect/retrieveTokenizedStoryById");

const HARDCODED_STORY_ID = "73a1ae3b-3c35-414b-8f9d-e4e241fe49e1";

const SUPPORTED_MODES = new Set([
  "word-to-synonym",
  "word-to-antonym",
  "word-to-definition",
]);

const SUPPORTED_PAIR_COUNTS = new Set([4, 5, 6]);

function buildPuzzle({ story, mode, pairCount }) {
  switch (mode) {
    case "word-to-synonym":
      return generateSynonymMatchPuzzle({ story, pairCount });
    case "word-to-antonym":
      return generateAntonymMatchPuzzle({ story, pairCount });
    case "word-to-definition":
      return generateDefinitionMatchPuzzle({ story, pairCount });
    default:
      throw new Error(`Unsupported mode: ${mode}`);
  }
}

function getPassageTitle(story) {
  if (story.title && story.title.englishversion) return story.title.englishversion;
  if (story.title && story.title.sanskritversion) return story.title.sanskritversion;
  return "Untitled Story";
}

async function getMeaningBridgeCandidateStories({ requestedStoryId = null } = {}) {
  const storyIds = [];
  if (requestedStoryId) storyIds.push(requestedStoryId);
  if (!storyIds.includes(HARDCODED_STORY_ID)) storyIds.push(HARDCODED_STORY_ID);

  const stories = [];
  for (const storyId of storyIds) {
    try {
      const story = await retrieveStoryById(storyId);
      if (story) stories.push(story);
    } catch (error) {
      // Skip stories that can't be retrieved; fall back to the next candidate.
    }
    //just for checking
  }

  return stories;
}

function buildPuzzleFromCandidateStories({ candidates, mode, pairCount }) {
  let lastError = null;

  for (const story of candidates) {
    try {
      const puzzle = buildPuzzle({ story, mode, pairCount });
      return { story, source: String(story._id), puzzle };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError
      ? `Could not build a ${mode} puzzle from any story: ${lastError.message}`
      : `Could not build a ${mode} puzzle from any story.`
  );
}

const getMeaningBridgeHealth = async (req, res) => {
  return res.status(200).json({
    success: true,
    ok: true,
    game: "meaning_bridge",
    status: "ready",
    message: "Meaning Bridge backend is ready.",
  });
};

const generateMeaningBridgeRound = async (req, res) => {
  try {
    const {
      pairCount = 4,
      mode = "word-to-synonym",
      storyId = null,
    } = req.body || {};

    const normalizedPairCount = Number(pairCount);

    if (!SUPPORTED_MODES.has(mode)) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: `Unsupported mode. Supported: ${[...SUPPORTED_MODES].join(", ")}`,
      });
    }

    if (!SUPPORTED_PAIR_COUNTS.has(normalizedPairCount)) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: "Unsupported pair count. Use 4, 5, or 6.",
      });
    }

    const candidates = await getMeaningBridgeCandidateStories({
      requestedStoryId: storyId,
    });

    if (!candidates.length) {
      return res.status(500).json({
        success: false,
        ok: false,
        error: "No tokenized stories were available for Meaning Bridge.",
      });
    }

    const { story, source, puzzle } = buildPuzzleFromCandidateStories({
      candidates,
      mode,
      pairCount: normalizedPairCount,
    });

    return res.status(200).json({
      success: true,
      ok: true,
      puzzle,
      passage: {
        passageId: String(story._id),
        title: getPassageTitle(story),
        text: (story.englishVersion || "").slice(0, 300),
        theme: story.category || "Story",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate round.",
    });
  }
};

module.exports = {
  getMeaningBridgeHealth,
  generateMeaningBridgeRound,
};
