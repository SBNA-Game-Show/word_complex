// src/app/User/canvas/ZimCanvas.js
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
          // 1. Create the scene
          scene = new MainScene(zimModule, frame.stage);

          // 2. Listen to the frame's internal resize calculations instead of restarting React
          frame.on("resize", () => {
            if (scene && typeof scene.handleResize === "function") {
              scene.handleResize();
            }
          });
        },
      });
    }

    init();

    return () => {
      if (scene) scene.destroy();
      if (frame) frame.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasTargetRef}
      style={{ width: "100%", height: "100vh", overflow: "hidden" }}
    />
  );
}
