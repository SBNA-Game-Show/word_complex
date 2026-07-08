/**
 * storySetsController.js
 * ----------------------
 * Admin-only handlers for the storySets collection.
 *
 * Heuristic (shape) validation happens HERE, before anything touches the
 * database. DB-dependent consistency checks (unknown storyIds, missing set,
 * deleting the active set) live in storySetsService and surface as
 * StorySetError with an HTTP status.
 *
 * Response shape matches the rest of the API: { success, data | message }.
 */

const service = require("../storySetsService");

const MAX_STORIES_PER_SET = 4;

/*
 * Shape checks for { name, storyIds }. Sets are immutable, so this only ever
 * runs on create.
 */
function validateSetPayload(body) {
  const errors = [];
  const { name, storyIds } = body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    errors.push("name must be a non-empty string");
  }

  if (!Array.isArray(storyIds)) {
    errors.push("storyIds must be an array");
  } else {
    if (storyIds.length < 1 || storyIds.length > MAX_STORIES_PER_SET) {
      errors.push(`storyIds must contain 1–${MAX_STORIES_PER_SET} ids`);
    }
    if (!storyIds.every((id) => typeof id === "string" && id.trim())) {
      errors.push("every storyId must be a non-empty string");
    }
    if (new Set(storyIds).size !== storyIds.length) {
      errors.push("storyIds must not contain duplicates");
    }
  }

  return errors;
}

function handleError(res, error) {
  if (error instanceof service.StorySetError) {
    return res
      .status(error.statusCode)
      .json({ success: false, message: error.message });
  }
  return res.status(500).json({ success: false, message: error.message });
}

/* GET /api/v1/admin/storySets — all sets, newest first, active one flagged. */
const listSets = async (req, res) => {
  try {
    const sets = await service.listSets();
    return res.status(200).json({ success: true, data: sets });
  } catch (error) {
    return handleError(res, error);
  }
};

/* POST /api/v1/admin/storySets — create a set { name, storyIds }. */
const createSet = async (req, res) => {
  try {
    const errors = validateSetPayload(req.body);
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: errors.join("; ") });
    }

    const doc = await service.createSet({
      name: req.body.name,
      storyIds: req.body.storyIds,
    });
    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    return handleError(res, error);
  }
};

/* DELETE /api/v1/admin/storySets/:setId — refuses to delete the active set. */
const deleteSet = async (req, res) => {
  try {
    await service.deleteSet(req.params.setId);
    return res.status(200).json({ success: true, data: null });
  } catch (error) {
    return handleError(res, error);
  }
};

/* PUT /api/v1/admin/storySets/active — { setId } flips the live pointer. */
const activateSet = async (req, res) => {
  try {
    const { setId } = req.body ?? {};
    if (typeof setId !== "string" || !setId.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "setId must be a non-empty string" });
    }

    const set = await service.activateSet(setId);
    return res.status(200).json({ success: true, data: set });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { listSets, createSet, deleteSet, activateSet };
