function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function getNumberOfBlanks(difficulty = "easy") {
  const difficultyMap = {
    easy: 3,
    medium: 6,
    hard: 9,
  };

  return difficultyMap[difficulty] || 3;
}

function getAnswers(tokenizedWords, wordTypes = ["NOUN"], numberOfBlanks = 3) {
  const filteredWords = tokenizedWords
    .filter((word) => wordTypes.includes(word.pos || word.upos))
    .map((word) => word.text);

  const uniqueWords = [...new Set(filteredWords)];

  return uniqueWords
    .sort(() => Math.random() - 0.5)
    .slice(0, numberOfBlanks);
}

function getDistractors(tokenizedWords, answers, wordTypes = ["NOUN"], count = 3) {
  // First try to get distractors from the selected word types
  const preferredWords = tokenizedWords
    .filter((word) => wordTypes.includes(word.pos || word.upos))
    .map((word) => word.text);

  const preferredUniqueWords = [...new Set(preferredWords)];

  let distractorPool = preferredUniqueWords.filter(
    (word) => !answers.includes(word)
  );

  // If not enough distractors, use other word types as backup
  if (distractorPool.length < count) {
    const backupWords = tokenizedWords
      .map((word) => word.text);

    const backupUniqueWords = [...new Set(backupWords)];

    const backupDistractors = backupUniqueWords.filter(
      (word) =>
        !answers.includes(word) &&
        !distractorPool.includes(word)
    );

    distractorPool = [
      ...distractorPool,
      ...backupDistractors,
    ];
  }

  return shuffleArray(distractorPool).slice(0, count);
}


function createFillInBlankGame(storyId, originalParagraph, answers, distractors) {
  let paragraphWithBlanks = originalParagraph;

  const answersInParagraphOrder = answers
    .map((answer) => ({
      word: answer,
      index: originalParagraph.indexOf(answer),
    }))
    .filter((item) => item.index !== -1)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.word);

  answersInParagraphOrder.forEach((answer) => {
    paragraphWithBlanks = paragraphWithBlanks.replace(answer, "_____");
  });

  const wordBank = shuffleArray([...answersInParagraphOrder, ...distractors]);

  return {
    id: storyId,
    originalParagraph,
    paragraph: paragraphWithBlanks,
    answers: answersInParagraphOrder,
    wordBank,
  };
}



module.exports = {
  getNumberOfBlanks,
  getAnswers,
  getDistractors,
  shuffleArray,
  createFillInBlankGame
};
