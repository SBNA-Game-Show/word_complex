const { v4: uuidv4 } = require("uuid");

function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function extractCandidateEntries(passageText, dictionary) {
  const passageWords = new Set(
    passageText.split(/\s+/).map(normalizeWord).filter(Boolean),
  );

  return dictionary.filter((entry) =>
    passageWords.has(normalizeWord(entry.english)),
  );
}

function getRightLabel(entry, mode) {
  switch (mode) {
    case "sanskrit-to-english":
      return {
        label: entry.english,
        sublabel: entry.definition,
      };

    case "word-to-definition":
      return {
        label: entry.definition,
        sublabel: entry.category,
      };

    case "word-to-synonym":
      return {
        label: entry.synonyms[0] || entry.definition,
        sublabel: "synonym",
      };

    case "word-to-antonym":
      return {
        label: entry.antonyms[0] || "No antonym available",
        sublabel: "antonym",
      };

    case "english-to-sanskrit":
    default:
      return {
        label: entry.sanskrit,
        sublabel: entry.transliteration,
      };
  }
}

function getLeftLabel(entry, mode) {
  if (mode === "sanskrit-to-english") {
    return {
      label: entry.sanskrit,
      sublabel: entry.transliteration,
    };
  }

  return {
    label: entry.english,
    sublabel: entry.category,
  };
}

function createRoundId() {
  return `round_${uuidv4().replace(/-/g, "").slice(0, 10)}`;
}

function generateMeaningBridgePuzzle(params) {
  const {
    passage,
    dictionary,
    mode = "english-to-sanskrit",
    difficulty = "medium",
    pairCount = 4,
  } = params;

  const passageCandidates = extractCandidateEntries(passage.text, dictionary);

  const modeCandidates =
    mode === "word-to-antonym"
      ? passageCandidates.filter((entry) => entry.antonyms.length > 0)
      : passageCandidates;

  const candidates = modeCandidates.slice(0, pairCount);

  if (candidates.length < 2) {
    throw new Error("Not enough dictionary-backed words found in passage.");
  }

  const leftItems = candidates.map((entry, index) => {
    const left = getLeftLabel(entry, mode);

    return {
      id: `left_${index}_${entry.english}`,
      label: left.label,
      sublabel: left.sublabel,
    };
  });

  const rightItemsOrdered = candidates.map((entry, index) => {
    const right = getRightLabel(entry, mode);

    return {
      id: `right_${index}_${entry.english}`,
      label: right.label,
      sublabel: right.sublabel,
    };
  });

  const answerKey = Object.fromEntries(
    leftItems.map((left, index) => [left.id, rightItemsOrdered[index].id]),
  );

  const hints = Object.fromEntries(
    leftItems.map((left, index) => {
      const entry = candidates[index];

      return [
        left.id,
        `${entry.english} is related to ${entry.category}. Transliteration: ${entry.transliteration}.`,
      ];
    }),
  );

  const hintImages = Object.fromEntries(
    leftItems.map((left, index) => {
      const entry = candidates[index];
      return [left.id, entry.imageUrl || `https://loremflickr.com/300/200/${encodeURIComponent(entry.english)}`];
    }),
  );

  return {
    gameId: "meaning_bridge",
    roundId: createRoundId(),
    passageId: passage.passageId,
    chunkId: passage.chunkId,
    mode,
    difficulty,
    instruction:
      "Connect each word to its correct meaning or Sanskrit translation.",
    leftItems,
    rightItems: shuffle(rightItemsOrdered),
    answerKey,
    hints,
    hintImages,
    scoreRules: {
      correct: 10,
      incorrect: 0,
      hintPenalty: 2,
      wrongAttemptPenalty: 5,
    },
  };
}

module.exports = {
  extractCandidateEntries,
  generateMeaningBridgePuzzle,
};
