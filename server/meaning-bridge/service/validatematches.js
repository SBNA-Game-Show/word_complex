function validateMatches(answerKey, matches) {
  return matches.map((match) => ({
    ...match,
    correct: answerKey[match.leftId] === match.rightId,
  }));
}

module.exports = {
  validateMatches,
};
