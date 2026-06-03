// Central registry for every ZIM game in the project.
// To add a new game: create a file in this folder that default-exports a
// React component (use `createZimGame`) and named-export a `meta` object,
// then register it below. Teammates can keep their game files independent.
import SentenceBuilder, { meta as sentenceBuilderMeta } from "./SentenceBuilder";

export const games = [
  { ...sentenceBuilderMeta, Component: SentenceBuilder }
  // { ...wordMeaningMatchMeta, Component: WordMeaningMatch },
  // { ...storySequenceMeta,    Component: StorySequence },
];

// Function to get the game by id
export function getGame(id) {
  return games.find((g) => g.id === id);
}
