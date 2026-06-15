import { useEffect, useRef } from "react";
import * as zim from "zimjs";

// This module is used to create a Zim game component which is a wrapper for the Zim game component that is used to create the game.
/**
 * Wraps a ZIM scene as a React component so individual games only need to
 * provide a `setup` function. The helper owns the React/ZIM lifecycle:
 * mounting the holder div, creating the Frame, and disposing on unmount.
 *
 * Each game module should default-export the result of this call:
 *
 *   export default createZimGame({
 *     id: "zim-my-game",
 *     width: 1100,
 *     height: 720,
 *     setup({ frame, stage, W, H, zim }) { ...game code... }
 *   });
 */
// Function to create the Zim game component
export function createZimGame({
  id,
  width,
  height,
  color = "#fff3d3",
  outerColor = "#151019",
  scaling,
  setup,
}) {
  // Function to create the Zim game component
  function ZimGameComponent() {
    const holderRef = useRef(null);
    // Use effect to create the Zim game component
    useEffect(() => {
      if (!holderRef.current) return undefined;

      let frame;
      let disposed = false;
      // Function to ready the Zim game component
      function ready() {
        if (disposed) return;

        const start = () => {
          if (disposed) return;
          setup({
            frame,
            stage: frame.stage,
            W: frame.width,
            H: frame.height,
            zim,
          });
        };

        if (document.fonts?.ready) {
          document.fonts.ready.then(start);
        } else {
          start();
        }
      }
      // Create a new Zim frame
      frame = new zim.Frame({
        scaling: scaling || id,
        width,
        height,
        color,
        outerColor,
        ready,
        allowDefault: true,
      });
      // Function to dispose the Zim game component
      return () => {
        disposed = true;
        if (frame) frame.dispose();
        if (holderRef.current) holderRef.current.innerHTML = "";
      };
    }, []);
    // Return the Zim game component
    return (
      <div
        ref={holderRef}
        id={id}
        className="zim-holder"
        data-testid={id}
        data-zim-game-id={id}
      />
    );
  }
  // Set the display name of the Zim game component
  ZimGameComponent.displayName = `ZimGame(${id})`;
  // Return the Zim game component
  return ZimGameComponent;
}
