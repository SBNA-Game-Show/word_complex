import { createZimGame } from "../createZimGame";
import Game from "./Game";

const wordTypes = {
  nouns: [
    "rabbit",
    "home",
    "weasel",
    "dispute",
    "cat",
    "opponents",
    "paw",
    "disputants",
    "quarrel",
  ],

  verbs: [
    "left",
    "moved",
    "refused",
    "move",
    "arose",
    "heard",
    "offered",
    "pacify",
    "asked",
    "come",
    "hear",
    "happened",
    "grabbed",
    "devour",
    "pacified",
  ],

  adjectives: ["great", "closer", "each"],
};

export default createZimGame({
  id: "word-hunt",

  width: 1280,
  height: 720,

  color: "#ECE8C8",
  outerColor: "#556B3D",

  setup({ stage, W, H, zim }) {
    const game = new Game({
      stage,
      W,
      H,
      zim,
      storyData,
      wordTypes,
    });

    game.start();
  },
});

export const meta = {
  id: "word-hunt",
  cardNumber: "04",
  cardArt: "art-hunt",
  title: "Word Hunt",
  description: "Find nouns hidden in the story passage.",
};
