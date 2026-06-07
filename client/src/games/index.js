// Central registry — single source of truth for all games.
//
// To add a new game:
//   1. Create your game in its own folder (e.g. games/WordMatch/index.jsx)
//   2. Export a `meta` object (id, cardNumber, cardArt, title, description)
//      and a default React component from that file
//   3. Import both below and add an entry with Component
//   4. That's it — the launcher will automatically show it as playable
//
// To mark a game as coming soon (no component yet), add an entry without Component.
// The launcher locks it automatically. No status flag needed.

import SentenceBuilder, {
  meta as sentenceBuilderMeta,
} from "./SentenceBuilder";
import MeaningBridge, { meta as meaningBridgeMeta } from "./MeaningBridge";
import ContextClozeQuest, {
  meta as contextClozeQuestMeta,
} from "./ContextClozeQuest";

export const games = [
  { ...sentenceBuilderMeta, Component: SentenceBuilder },
  { ...meaningBridgeMeta, Component: MeaningBridge },
  { ...contextClozeQuestMeta, Component: ContextClozeQuest },
  {
    id: "word-hunt",
    cardNumber: "04",
    cardArt: "art-hunt",
    title: "Word Hunt",
    description: "Search for hidden words and collect bright clues.",
  },
];

export function getGame(id) {
  return games.find((g) => g.id === id);
}
