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
  const filteredWords = tokenizedWords
    .filter((word) => wordTypes.includes(word.pos || word.upos))
    .map((word) => word.text);

  const uniqueWords = [...new Set(filteredWords)];

  const distractorPool = uniqueWords.filter(
    (word) => !answers.includes(word)
  );

  return shuffleArray(distractorPool).slice(0, count);
}


function createFillInBlankGame(storyId, originalParagraph, answers, distractors) {
  let paragraphWithBlanks = originalParagraph;

  answers.forEach((answer) => {
    paragraphWithBlanks = paragraphWithBlanks.replace(answer, "_____");
  });

  const wordBank = shuffleArray([...answers, ...distractors]);

  return {
    id: storyId,
    originalParagraph,
    paragraph: paragraphWithBlanks,
    answers,
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
