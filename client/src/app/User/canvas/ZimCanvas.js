"use client";

import { useEffect, useRef } from "react";
// 1. Keep MainScene as a top-level static import so Next.js actively watches it!
import MainScene from "@/app/User/canvas/Mainscene";

export default function ZimCanvas() {
  const canvasTargetRef = useRef(null);

  useEffect(() => {
    let frame = null;
    let scene = null;
    let isDestroyed = false;

    async function init() {
      const zimModule = await import("zimjs");
      const { Frame, FIT, zimplify } = zimModule;

      if (isDestroyed) return;
      zimplify();

      if (canvasTargetRef.current) {
        canvasTargetRef.current.innerHTML = "";
      }

      frame = new Frame({
        scaling: FIT,
        width: 1024,
        height: 768,
        outerColor: zimModule.light,
        color: zimModule.dark,
        container: canvasTargetRef.current,
        ready: () => {
          if (isDestroyed) {
            frame.dispose();
            return;
          }

          // 2. MainScene is used here normally
          scene = new MainScene(zimModule, frame.stage);

          frame.on("resize", () => {
            scene?.handleResize?.();
          });
        },
      });
    }

    init();

    return () => {
      isDestroyed = true;
      if (scene) scene.destroy();
      if (frame) frame.dispose();

      if (canvasTargetRef.current) {
        canvasTargetRef.current.innerHTML = "";
      }
    };
  }, [MainScene]); // 3. Putting MainScene here FORCES the effect to re-run on code change!

  return (
    <div
      ref={canvasTargetRef}
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    />
  );
}
