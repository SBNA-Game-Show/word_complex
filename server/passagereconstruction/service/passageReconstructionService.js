const retrieveStoryById = require("../../raw-data-connect/retrieveTokenizedStoryById");

const getPassageReconstructionGame = async (storyId) => {
  if (!storyId) {
    throw new Error("Story Id is required");
  }

  const story = await retrieveStoryById(storyId);

  const { passage } = extractPassageData(story);
  const sentences = splitIntoSentences(passage);
  const rounds = buildReconstructionRounds(sentences);

  return { passage, rounds };
};

const extractPassageData = (story) => {
  if (!story) {
    throw new Error("Story data not found");
  }

  return { passage: story.englishVersion };
};

const splitIntoSentences = (passage) => {
  if (!passage) {
    throw new Error("Passage is missing");
  }

  return passage
    .match(/[^.!?]+[.!?]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const shuffle = (arr) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const buildChunks = (sentence) => {
  const words = sentence.trim().split(/\s+/);
  const total = words.length;

  const answer = [];
  for (let i = 0; i < 4; i++) {
    const start = Math.floor((i * total) / 4);
    const end = Math.floor(((i + 1) * total) / 4);
    answer.push(words.slice(start, end).join(" "));
  }

  // Reroll if the shuffle lands on the answer order, so a round never arrives pre-solved.
  // Skipped when all chunks are identical, since no permutation could differ.
  let chunks = shuffle(answer);
  if (new Set(answer).size > 1) {
    while (chunks.every((chunk, i) => chunk === answer[i])) {
      chunks = shuffle(answer);
    }
  }

  return { sentence, chunks, answer };
};

const buildReconstructionRounds = (sentences) => {
  return sentences.slice(0, 3).map((sentence) => buildChunks(sentence));
};

module.exports = {
  getPassageReconstructionGame,
  extractPassageData,
  splitIntoSentences,
  buildChunks,
  buildReconstructionRounds,
};
