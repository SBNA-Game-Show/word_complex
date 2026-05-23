"use client";

import { useEffect, useRef } from "react";
import MainScene from "@/app/User/canvas/Mainscene";

export default function ZimCanvas() {
  const canvasTargetRef = useRef(null);

  useEffect(() => {
    let frame;
    let scene;

    async function init() {
      const zimModule = await import("zimjs");
      const { Frame, FIT, zimplify } = zimModule;

      zimplify();

      frame = new Frame({
        scaling: FIT,
        width: 1024,
        height: 768,
        outerColor: zimModule.light,
        color: zimModule.dark,
        container: canvasTargetRef.current,

        ready: () => {
          scene = new MainScene(zimModule, frame.stage);

          frame.on("resize", () => {
            scene?.handleResize?.();
          });
        },
      });
    }

    init();

    // HOT RELOAD SUPPORT
    if (module.hot) {
      module.hot.dispose(() => {
        if (scene) scene.destroy();
        if (frame) frame.dispose();
      });
    }

    return () => {
      if (scene) scene.destroy();
      if (frame) frame.dispose();
    };
  }, []);

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
