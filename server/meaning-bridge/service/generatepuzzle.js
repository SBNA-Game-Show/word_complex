const { v4: uuidv4 } = require("uuid");

const SKIP_POS = new Set([
  "SPACE",
  "PUNCT",
  "DET",
  "PRON",
  "ADP",
  "CCONJ",
  "SCONJ",
  "PART",
  "NUM",
]);

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createRoundId() {
  return `round_${uuidv4().replace(/-/g, "").slice(0, 10)}`;
}

function generateSynonymMatchPuzzle({ story, pairCount = 4 }) {
  const tokens = story.tokenized_english_version || [];
  const pairs = [];
  const seen = new Set();

  for (const token of tokens) {
    if (!token || !token.text || !token.synonyms || token.synonyms.length === 0)
      continue;
    if (SKIP_POS.has(token.pos)) continue;

    const word = token.text.toLowerCase();
    const synonym = token.synonyms[0];

    if (!synonym || word === synonym) continue;

    const key = `${word}__${synonym}`;
    if (seen.has(key)) continue;
    seen.add(key);

    pairs.push({ form: token.text, lemma: synonym, pos: token.pos || "WORD" });
  }

  if (pairs.length < 2) {
    throw new Error(`Not enough synonym data. Found ${pairs.length} pairs.`);
  }

  const candidates = shuffle(pairs).slice(0, pairCount);

  const leftItems = candidates.map((p, i) => ({
    id: `left_${i}`,
    label: p.form,
    sublabel: p.pos.toLowerCase(),
  }));

  const rightItemsOrdered = candidates.map((p, i) => ({
    id: `right_${i}`,
    label: p.lemma,
    sublabel: "synonym",
  }));

  const answerKey = Object.fromEntries(
    leftItems.map((l, i) => [l.id, rightItemsOrdered[i].id]),
  );

  const hints = Object.fromEntries(
    leftItems.map((l, i) => [
      l.id,
      `"${candidates[i].form}" and "${candidates[i].lemma}" have the same meaning.`,
    ]),
  );

  return {
    gameId: "meaning_bridge",
    roundId: createRoundId(),
    mode: "word-to-synonym",
    instruction: "Match each word to one of its synonyms.",
    leftItems,
    rightItems: shuffle(rightItemsOrdered),
    answerKey,
    hints,
    scoreRules: {
      correct: 10,
      incorrect: 0,
      hintPenalty: 2,
      wrongAttemptPenalty: 5,
    },
  };
}

function generateAntonymMatchPuzzle({ story, pairCount = 4 }) {
  const tokens = story.tokenized_english_version || [];
  const pairs = [];
  const seen = new Set();

  for (const token of tokens) {
    if (!token || !token.text || !token.antonyms || token.antonyms.length === 0)
      continue;
    if (SKIP_POS.has(token.pos)) continue;

    const word = token.text.toLowerCase();
    const antonym = token.antonyms[0];

    if (!antonym || word === antonym) continue;

    const key = `${word}__${antonym}`;
    if (seen.has(key)) continue;
    seen.add(key);

    pairs.push({ form: token.text, lemma: antonym, pos: token.pos || "WORD" });
  }

  if (pairs.length < 2) {
    throw new Error(`Not enough antonym data. Found ${pairs.length} pairs.`);
  }

  const candidates = shuffle(pairs).slice(0, pairCount);

  const leftItems = candidates.map((p, i) => ({
    id: `left_${i}`,
    label: p.form,
    sublabel: p.pos.toLowerCase(),
  }));

  const rightItemsOrdered = candidates.map((p, i) => ({
    id: `right_${i}`,
    label: p.lemma,
    sublabel: "antonym",
  }));

  const answerKey = Object.fromEntries(
    leftItems.map((l, i) => [l.id, rightItemsOrdered[i].id]),
  );

  const hints = Object.fromEntries(
    leftItems.map((l, i) => [
      l.id,
      `"${candidates[i].form}" and "${candidates[i].lemma}" are opposites.`,
    ]),
  );

  return {
    gameId: "meaning_bridge",
    roundId: createRoundId(),
    mode: "word-to-antonym",
    instruction: "Match each word to its opposite (antonym).",
    leftItems,
    rightItems: shuffle(rightItemsOrdered),
    answerKey,
    hints,
    scoreRules: {
      correct: 10,
      incorrect: 0,
      hintPenalty: 2,
      wrongAttemptPenalty: 5,
    },
  };
}

function generateDefinitionMatchPuzzle({ story, pairCount = 4 }) {
  // Definition mode plays with the SANSKRIT tokens: the player matches each
  // Sanskrit word to its definition. Sanskrit tokens use `upos` (not `pos`)
  // for the part of speech: { text, lemma, upos, features, definition }.
  const tokens = story.tokenized_sanskrit_version || [];
  const pairs = [];
  const seen = new Set();

  for (const token of tokens) {
    if (!token || !token.text || !token.definition) continue;
    if (SKIP_POS.has(token.upos)) continue;

    const word = token.text.toLowerCase();
    const definition = token.definition;

    if (!definition) continue;

    const key = `${word}__${definition}`;
    if (seen.has(key)) continue;
    seen.add(key);

    pairs.push({ form: token.text, definition, pos: token.upos || "WORD" });
  }

  if (pairs.length < 2) {
    throw new Error(`Not enough definition data. Found ${pairs.length} pairs.`);
  }

  const candidates = shuffle(pairs).slice(0, pairCount);

  const leftItems = candidates.map((p, i) => ({
    id: `left_${i}`,
    label: p.form,
    sublabel: p.pos.toLowerCase(),
  }));

  const rightItemsOrdered = candidates.map((p, i) => {
    // trim long definitions to 2 lines max (~60 chars)
    const def =
      p.definition.length > 60
        ? p.definition.slice(0, 57).trimEnd() + "…"
        : p.definition;
    return { id: `right_${i}`, label: def, sublabel: "definition" };
  });

  const answerKey = Object.fromEntries(
    leftItems.map((l, i) => [l.id, rightItemsOrdered[i].id]),
  );

  const hints = Object.fromEntries(
    leftItems.map((l, i) => [
      l.id,
      `"${candidates[i].form}" means: "${candidates[i].definition}".`,
    ]),
  );

  return {
    gameId: "meaning_bridge",
    roundId: createRoundId(),
    mode: "word-to-definition",
    instruction: "Match each word to its definition.",
    leftItems,
    rightItems: shuffle(rightItemsOrdered),
    answerKey,
    hints,
    scoreRules: {
      correct: 10,
      incorrect: 0,
      hintPenalty: 2,
      wrongAttemptPenalty: 5,
    },
  };
}

module.exports = {
  generateSynonymMatchPuzzle,
  generateAntonymMatchPuzzle,
  generateDefinitionMatchPuzzle,
};
