const tokenizedWords = [
  { text: "The", pos: "DET" },
  { text: "little", pos: "ADJ" },
  { text: "girl", pos: "NOUN" },
  { text: "woke", pos: "VERB" },
  { text: "garden", pos: "NOUN" },
  { text: "mom", pos: "NOUN" },
];

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function createFillInBlankGame(originalParagraph, answers, distractors) {
  let paragraphWithBlanks = originalParagraph;

  answers.forEach((answer) => {
    paragraphWithBlanks = paragraphWithBlanks.replace(answer, "_____");
  });

  const wordBank = shuffleArray([...answers, ...distractors]);

  return {
    id: "story1",
    originalParagraph,
    paragraph: paragraphWithBlanks,
    answers,
    wordBank,
  };
}

function getAnswers(selectedWords, numberOfBlanks) {
  const answerWords = selectedWords.map((word) => word.text);

  const shuffledAnswers = shuffleArray(answerWords);

  const limitedAnswers = shuffledAnswers.slice(0, numberOfBlanks);

  return limitedAnswers;
}

async function initializeGame(req, res) {
  const originalParagraph =
    "The little girl woke up early in the morning. She wanted to help her mom in the garden.";

  const wordType = req.query.wordType || "NOUN";
  const numberOfBlanks = Number(req.query.blanks) || 2;

  // Validation

  const allowedWordTypes = ["NOUN", "VERB", "ADJ"];

  if (!allowedWordTypes.includes(wordType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid wordType. Use NOUN, VERB, or ADJ.",
    });
  }

  if (numberOfBlanks < 1) {
    return res.status(400).json({
      success: false,
      message: "blanks must be at least 1.",
    });
  }

  const selectedWords = tokenizedWords.filter(
    (word) => word.pos === wordType
  );

  if (numberOfBlanks > selectedWords.length) {
    return res.status(400).json({
      success: false,
      message: `Only ${selectedWords.length} ${wordType} word(s) available.`,
    });
  }

  const answers = getAnswers(selectedWords, numberOfBlanks);

  const distractors = ["animals", "day", "milk"];

  const gameData = createFillInBlankGame(
    originalParagraph,
    answers,
    distractors
  );

  return res.status(200).json({
    success: true,
    data: gameData,
  });
}

module.exports = { initializeGame };