const { validateMatches } = require("./validatematches");

function scoreMeaningBridgeRound(params) {
  const {
    answerKey,
    matches,
    hintsUsed = 0,
    wrongAttempts = 0,
    correctValue = 10,
    incorrectValue = 0,
    hintPenalty = 2,
    wrongAttemptPenalty = 5,
  } = params;

  const validated = validateMatches(answerKey, matches);
  const totalMatches = Object.keys(answerKey).length;
  const correctMatches = validated.filter((match) => match.correct).length;
  const incorrectMatches = Math.max(0, matches.length - correctMatches);

  const perfectRound =
    totalMatches > 0 &&
    correctMatches === totalMatches &&
    incorrectMatches === 0 &&
    wrongAttempts === 0;

  const roundPoints = perfectRound ? 1 : 0;

  const rawScore =
    correctMatches * correctValue +
    incorrectMatches * incorrectValue -
    hintsUsed * hintPenalty -
    wrongAttempts * wrongAttemptPenalty;

  const score = Math.max(0, rawScore);
  const accuracy =
    totalMatches === 0 ? 0 : Math.round((correctMatches / totalMatches) * 100);

  let message = "Good try — keep practicing!";

  if (perfectRound) {
    message = "Excellent work! Perfect round point earned.";
  } else if (wrongAttempts > 0) {
    message =
      "Round completed, but no round point earned because a wrong match was attempted.";
  } else if (incorrectMatches > 0) {
    message =
      "Round completed, but no round point earned because not every submitted match was correct.";
  }

  return {
    score,
    accuracy,
    correctMatches,
    incorrectMatches,
    totalMatches,
    wrongAttempts,
    roundPoints,
    perfectRound,
    message,
  };
}

module.exports = {
  scoreMeaningBridgeRound,
};
