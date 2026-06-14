import { createZimGame } from "../createZimGame";
import Game from "./Game";

const storyData = {
  story:
    "When the rabbit left his home, a weasel moved in and refused to move out again. A great dispute arose over this. When the cat heard this, she offered to pacify the dispute. She asked the opponents to come closer to her, because she could not hear well. When this happened, she grabbed one of the disputants with each paw to devour them. Thus she pacified the quarrel.",
};

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

  adjectives: [
    "great",
    "closer",
    "each",
  ],
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