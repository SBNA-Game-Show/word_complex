const { retrieveStoryById } = require("../../raw-data-connect/retrieveTokenizedStoryById");

// Language configuration for the passage reconstruction game
const LANGUAGE_CONFIG = {
  english: { field: "englishVersion" },
  sanskrit: { field: "sanskritVersion" },
};

// Normalize the language to the supported languages
const normalizeLanguage = (language = "english") => {
  const normalized = String(language || "english").trim().toLowerCase();

  if (!LANGUAGE_CONFIG[normalized]) {
    throw new Error(`Unsupported language: ${language}`);
  }

  return normalized;
};

// Get the passage reconstruction game for a given story id and language
const getPassageReconstructionGame = async (storyId, language = "english") => {
  if (!storyId) {
    throw new Error("Story Id is required");
  }

  const normalizedLanguage = normalizeLanguage(language);
  const story = await retrieveStoryById(storyId);

  const { passage } = extractPassageData(story, normalizedLanguage);
  const sentences = splitIntoSentences(passage);
  const rounds = buildReconstructionRounds(sentences);

  return { passage, language: normalizedLanguage, rounds };
};

// Extract the passage data from the story
const extractPassageData = (story, language = "english") => {
  if (!story) {
    throw new Error("Story data not found");
  }

  const normalizedLanguage = normalizeLanguage(language);
  const { field } = LANGUAGE_CONFIG[normalizedLanguage];
  const passage = story[field];

  // If the passage is an array, return the array
  if (Array.isArray(passage)) {
    return {
      passage: passage
        .map((sentence) => (typeof sentence === "string" ? sentence.trim() : ""))
        .filter(Boolean),
    };
  }

  return { passage };
};

// Split the passage into sentences
const splitIntoSentences = (passage) => {
  if (Array.isArray(passage)) {
    const sentences = passage
      .map((sentence) => (typeof sentence === "string" ? sentence.trim() : ""))
      .filter(Boolean);

    if (!sentences.length) {
      throw new Error("Passage is missing");
    }

    return sentences;
  }

  if (!passage || typeof passage !== "string" || !passage.trim()) {
    throw new Error("Passage is missing");
  }

  const sentences = passage
    .trim()
    .match(/[^.!?।॥]+(?:[.!?]+|[।॥]+)/g);

  return (sentences || [passage])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

// Shuffle the array
const shuffle = (arr) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// Build the chunks for a given sentence
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
  const playableRounds = sentences
    .map((sentence) => buildChunks(sentence))
    .filter((round) => round.answer.every((chunk) => chunk.trim().length > 0));

  if (playableRounds.length < 3) {
    throw new Error("At least three playable sentences are required");
  }

  return playableRounds.slice(0, 3);
};

// Export the functions
module.exports = {
  getPassageReconstructionGame,
  normalizeLanguage,
  extractPassageData,
  splitIntoSentences,
  buildChunks,
  buildReconstructionRounds,
};
