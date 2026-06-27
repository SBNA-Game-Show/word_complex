import { createZimGame } from "../createZimGame";
import Game from "./Game";

export default createZimGame({
  id: "word-hunt",

  width: 1280,
  height: 720,

  color: "#FFE0C4BF",
  outerColor: "#556B3D",

  setup({ stage, W, H, zim }) {
    const game = new Game({
      stage,
      W,
      H,
      zim,
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
