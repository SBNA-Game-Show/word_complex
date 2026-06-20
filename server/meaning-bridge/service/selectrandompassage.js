function getPassagesForDifficulty(passages, difficulty) {
  return passages.filter((passage) => passage.difficulty === difficulty);
}

function selectRandomPassageForDifficulty(params) {
  const {
    passages,
    difficulty,
    previousPassageId = null,
    random = Math.random,
  } = params;

  const matchingDifficulty = getPassagesForDifficulty(passages, difficulty);

  const candidatePool =
    matchingDifficulty.length > 0 ? matchingDifficulty : [...passages];

  if (candidatePool.length === 0) {
    throw new Error("No passages are available for round generation.");
  }

  const nonRepeatedCandidates = candidatePool.filter(
    (passage) => passage.passageId !== previousPassageId,
  );

  const finalPool =
    nonRepeatedCandidates.length > 0 ? nonRepeatedCandidates : candidatePool;

  const selectedIndex = Math.floor(random() * finalPool.length);

  return finalPool[Math.max(0, Math.min(finalPool.length - 1, selectedIndex))];
}

module.exports = {
  getPassagesForDifficulty,
  selectRandomPassageForDifficulty,
};
