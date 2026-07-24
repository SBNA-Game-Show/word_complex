import { createZimGame } from "../createZimGame";
import Game from "./Game";

/*
 * E2E TEST PLUMBING:
 * Cleanup is isolated to the React/GameScene lifecycle wrapper. Game.destroy()
 * is also used internally between Word Hunt subgames and therefore must not
 * remove the browser bridge.
 */
import { removeWordHuntE2EBridge } from "./e2eTestBridge";

export default createZimGame({
  id: "word-hunt",

  width: 1280,
  height: 720,

  color: "#FFE0C4BF",
  outerColor: "#556B3D",

  setup({ frame, stage, W, H, zim, authUser }) {
    const game = new Game({
      frame,
      stage,
      W,
      H,
      zim,
      authUser,
    });

    game.start();

    return () => {
      /*
       * Preserve the existing Word Hunt teardown exactly as before.
       */
      game.destroy();

      /*
       * E2E TEST HOOK CLEANUP:
       * The React GameScene is now unmounting, so remove the test-only globals.
       * This does not run during normal noun → verb → adjective progression.
       */
      removeWordHuntE2EBridge();
    };
  },
});

export const meta = {
  id: "word-hunt",
  cardNumber: "04",
  cardArt: "art-hunt",
  title: "Word Hunt",
  description: "Find nouns hidden in the story passage.",
};
