const { v4: uuidv4 } = require("uuid");

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

const SKIP_POS = new Set(["SPACE","PUNCT","DET","PRON","ADP","CCONJ","SCONJ","PART","NUM"]);
const MEANINGFUL_UPOS = new Set(["NOUN","ADJ","VERB","NUM"]);
const SENT_END = new Set([".", "?", "!", "।", "॥"]);

function extractTokenPairs(story) {
  const sentences = story.tokenized_sanskrit_version || [];
  const pairs = [];
  const seen = new Set();
  for (const sentence of sentences) {
    if (!Array.isArray(sentence)) continue;
    for (const token of sentence) {
      if (!token || typeof token !== "object") continue;
      const form = token.text, lemma = token.lemma, upos = token.upos || "";
      if (!form || !lemma || form === lemma || !MEANINGFUL_UPOS.has(upos)) continue;
      const key = `${form}__${lemma}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ form, lemma, pos: upos });
    }
  }
  console.log(`[DEBUG] Sanskrit lemma pairs found: ${pairs.length}`);
  return pairs;
}

function extractTransliterationPairs(story) {
  const sanskrit = story.sanskritVersion || [];
  const transliterated = story.transliteratedVersion || [];
  const pairs = [];
  const seen = new Set();
  const len = Math.min(sanskrit.length, transliterated.length);
  for (let i = 0; i < len; i++) {
    const sanWords = String(sanskrit[i]||"").split(/\s+/).map(w=>w.replace(/[।॥|,.!?]/g,"").trim()).filter(Boolean);
    const transWords = String(transliterated[i]||"").split(/\s+/).map(w=>w.replace(/[|,.!?]/g,"").trim()).filter(Boolean);
    const wlen = Math.min(sanWords.length, transWords.length);
    for (let j = 0; j < wlen; j++) {
      const san = sanWords[j], trans = transWords[j];
      if (!san || !trans || san === trans || san.length < 2) continue;
      const key = `${san}__${trans}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ form: san, lemma: trans, pos: "WORD" });
    }
  }
  console.log(`[DEBUG] Transliteration fallback pairs found: ${pairs.length}`);
  return pairs;
}

function generatePuzzleFromTokenizedStory({ story, pairCount = 4 }) {
  let pairs = extractTokenPairs(story);
  let mode = "lemma";
  if (pairs.length < 2) { pairs = extractTransliterationPairs(story); mode = "transliteration"; }
  if (pairs.length < 2) throw new Error("Not enough word pairs found in this story.");
  const candidates = shuffle(pairs).slice(0, pairCount);
  const leftItems = candidates.map((p, i) => ({
    id: `left_${i}`, label: p.form,
    sublabel: p.pos === "WORD" ? "Sanskrit" : p.pos.toLowerCase(),
  }));
  const rightItemsOrdered = candidates.map((p, i) => ({
    id: `right_${i}`, label: p.lemma,
    sublabel: p.pos === "WORD" ? "transliteration" : "root form",
  }));
  const answerKey = Object.fromEntries(leftItems.map((l, i) => [l.id, rightItemsOrdered[i].id]));
  const hints = Object.fromEntries(leftItems.map((l, i) => [
    l.id,
    mode === "lemma"
      ? `"${candidates[i].form}" is the ${candidates[i].pos.toLowerCase()} form of "${candidates[i].lemma}".`
      : `"${candidates[i].form}" in Devanagari is "${candidates[i].lemma}" in Roman script.`,
  ]));
  return {
    gameId: "meaning_bridge", roundId: createRoundId(), mode: "word-match",
    instruction: mode === "lemma"
      ? "Match each inflected Sanskrit word to its root (lemma) form."
      : "Match each Sanskrit word to its transliterated form.",
    leftItems, rightItems: shuffle(rightItemsOrdered), answerKey, hints,
    scoreRules: { correct: 10, incorrect: 0, hintPenalty: 2, wrongAttemptPenalty: 5 },
  };
}

function generateSynonymMatchPuzzle({ story, pairCount = 4 }) {
  const tokens = story.tokenized_english_version || [];
  const pairs = [], seen = new Set();
  for (const token of tokens) {
    if (!token || !token.text || !token.synonyms || token.synonyms.length === 0) continue;
    if (SKIP_POS.has(token.pos)) continue;
    const word = token.text.toLowerCase(), synonym = token.synonyms[0];
    if (!synonym || word === synonym) continue;
    const key = `${word}__${synonym}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ form: token.text, lemma: synonym, pos: token.pos || "WORD" });
  }
  console.log(`[DEBUG] Synonym pairs found: ${pairs.length}`);
  if (pairs.length < 2) throw new Error(`Not enough synonym data. Found ${pairs.length} pairs.`);
  const candidates = shuffle(pairs).slice(0, pairCount);
  const leftItems = candidates.map((p, i) => ({ id: `left_${i}`, label: p.form, sublabel: p.pos.toLowerCase() }));
  const rightItemsOrdered = candidates.map((p, i) => ({ id: `right_${i}`, label: p.lemma, sublabel: "synonym" }));
  const answerKey = Object.fromEntries(leftItems.map((l, i) => [l.id, rightItemsOrdered[i].id]));
  const hints = Object.fromEntries(leftItems.map((l, i) => [l.id, `"${candidates[i].form}" and "${candidates[i].lemma}" have the same meaning.`]));
  return {
    gameId: "meaning_bridge", roundId: createRoundId(), mode: "word-to-synonym",
    instruction: "Match each word to one of its synonyms.",
    leftItems, rightItems: shuffle(rightItemsOrdered), answerKey, hints,
    scoreRules: { correct: 10, incorrect: 0, hintPenalty: 2, wrongAttemptPenalty: 5 },
  };
}

function generateAntonymMatchPuzzle({ story, pairCount = 4 }) {
  const tokens = story.tokenized_english_version || [];
  const pairs = [], seen = new Set();
  for (const token of tokens) {
    if (!token || !token.text || !token.antonyms || token.antonyms.length === 0) continue;
    if (SKIP_POS.has(token.pos)) continue;
    const word = token.text.toLowerCase(), antonym = token.antonyms[0];
    if (!antonym || word === antonym) continue;
    const key = `${word}__${antonym}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ form: token.text, lemma: antonym, pos: token.pos || "WORD" });
  }
  console.log(`[DEBUG] Antonym pairs found: ${pairs.length}`);
  if (pairs.length < 2) throw new Error(`Not enough antonym data. Found ${pairs.length} pairs.`);
  const candidates = shuffle(pairs).slice(0, pairCount);
  const leftItems = candidates.map((p, i) => ({ id: `left_${i}`, label: p.form, sublabel: p.pos.toLowerCase() }));
  const rightItemsOrdered = candidates.map((p, i) => ({ id: `right_${i}`, label: p.lemma, sublabel: "antonym" }));
  const answerKey = Object.fromEntries(leftItems.map((l, i) => [l.id, rightItemsOrdered[i].id]));
  const hints = Object.fromEntries(leftItems.map((l, i) => [l.id, `"${candidates[i].form}" and "${candidates[i].lemma}" are opposites.`]));
  return {
    gameId: "meaning_bridge", roundId: createRoundId(), mode: "word-to-antonym",
    instruction: "Match each word to its opposite (antonym).",
    leftItems, rightItems: shuffle(rightItemsOrdered), answerKey, hints,
    scoreRules: { correct: 10, incorrect: 0, hintPenalty: 2, wrongAttemptPenalty: 5 },
  };
}

function generateWordDefinitionPuzzle({ story, pairCount = 4 }) {
  const tokens = story.tokenized_english_version || [];
  const pairs = [], seen = new Set();
  for (const token of tokens) {
    if (!token || !token.text || !token.synonyms || token.synonyms.length < 2) continue;
    if (SKIP_POS.has(token.pos)) continue;
    const word = token.text, definition = token.synonyms.slice(0, 3).join(", ");
    if (!definition) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ form: word, lemma: definition, pos: token.pos || "WORD" });
  }
  console.log(`[DEBUG] Word-definition pairs found: ${pairs.length}`);
  if (pairs.length < 2) throw new Error(`Not enough definition data. Found ${pairs.length} pairs.`);
  const candidates = shuffle(pairs).slice(0, pairCount);
  const leftItems = candidates.map((p, i) => ({ id: `left_${i}`, label: p.form, sublabel: p.pos.toLowerCase() }));
  const rightItemsOrdered = candidates.map((p, i) => ({ id: `right_${i}`, label: p.lemma, sublabel: "means..." }));
  const answerKey = Object.fromEntries(leftItems.map((l, i) => [l.id, rightItemsOrdered[i].id]));
  const hints = Object.fromEntries(leftItems.map((l, i) => [l.id, `"${candidates[i].form}" can mean: ${candidates[i].lemma}.`]));
  return {
    gameId: "meaning_bridge", roundId: createRoundId(), mode: "word-to-definition",
    instruction: "Match each word to its meaning.",
    leftItems, rightItems: shuffle(rightItemsOrdered), answerKey, hints,
    scoreRules: { correct: 10, incorrect: 0, hintPenalty: 2, wrongAttemptPenalty: 5 },
  };
}

function generateSentenceMatchPuzzle({ story, pairCount = 3 }) {
  const rawSanskrit = story.sanskritVersion || [];
  const rawTranslit = story.transliteratedVersion || [];
  const validPairs = [];
  const len = Math.min(rawSanskrit.length, rawTranslit.length);
  for (let i = 0; i < len; i++) {
    const san = String(rawSanskrit[i] || "").trim();
    const trans = String(rawTranslit[i] || "").trim();
    if (
      san.split(/\s+/).filter(Boolean).length >= 2 &&
      trans.split(/\s+/).filter(Boolean).length >= 2
    ) {
      validPairs.push({ sanskrit: san, transliterated: trans });
    }
  }
  const maxPairs = Math.min(pairCount, validPairs.length);
  console.log(`[DEBUG] Sentence match - valid pairs: ${validPairs.length}, using: ${maxPairs}`);
  if (maxPairs < 2) {
    throw new Error(`Not enough sentence pairs. Found ${validPairs.length} valid pairs.`);
  }
  const pairs = shuffle(validPairs).slice(0, maxPairs);
  const leftItems = pairs.map((p, i) => ({ id: `left_${i}`, label: p.sanskrit, sublabel: "Sanskrit" }));
  const rightItemsOrdered = pairs.map((p, i) => ({ id: `right_${i}`, label: p.transliterated, sublabel: "transliteration" }));
  const answerKey = Object.fromEntries(leftItems.map((l, i) => [l.id, rightItemsOrdered[i].id]));
  const hints = Object.fromEntries(leftItems.map((l, i) => {
    const first3 = pairs[i].transliterated.split(/\s+/).slice(0, 3).join(" ");
    return [l.id, `This sentence starts with "${first3}..." in transliteration.`];
  }));
  return {
    gameId: "meaning_bridge", roundId: createRoundId(), mode: "sentence-match",
    instruction: "Match each Sanskrit sentence to its transliteration.",
    leftItems, rightItems: shuffle(rightItemsOrdered), answerKey, hints,
    scoreRules: { correct: 10, incorrect: 0, hintPenalty: 2, wrongAttemptPenalty: 5 },
  };
}

function generateWordTransliterationPuzzle({ story, pairCount = 4 }) {
  const pairs = extractTransliterationPairs(story);
  if (pairs.length < 2) throw new Error("Not enough transliteration word pairs in this story.");
  const candidates = shuffle(pairs).slice(0, pairCount);
  const leftItems = candidates.map((p, i) => ({
    id: `left_${i}`, label: p.form, sublabel: "Sanskrit word",
  }));
  const rightItemsOrdered = candidates.map((p, i) => ({
    id: `right_${i}`, label: p.lemma, sublabel: "transliteration",
  }));
  const answerKey = Object.fromEntries(leftItems.map((l, i) => [l.id, rightItemsOrdered[i].id]));
  const hints = Object.fromEntries(leftItems.map((l, i) => [
    l.id, `"${candidates[i].form}" is written as "${candidates[i].lemma}" in Roman script.`,
  ]));
  return {
    gameId: "meaning_bridge", roundId: createRoundId(), mode: "word-to-antonym",
    instruction: "Match each Sanskrit word to its Roman transliteration.",
    leftItems, rightItems: shuffle(rightItemsOrdered), answerKey, hints,
    scoreRules: { correct: 10, incorrect: 0, hintPenalty: 2, wrongAttemptPenalty: 5 },
  };
}

// english-to-sanskrit mode is not yet supported — data pipeline pending

// sanskrit-to-english mode is not yet supported — data pipeline pending

module.exports = {
  generatePuzzleFromTokenizedStory,
  generateWordTransliterationPuzzle,
  generateSynonymMatchPuzzle,
  generateAntonymMatchPuzzle,
  generateWordDefinitionPuzzle,
  generateSentenceMatchPuzzle,
};
