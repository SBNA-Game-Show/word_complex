import { useEffect, useRef } from "react";
import * as zim from "zimjs";

/**
 * Wraps a ZIM scene as a React component so individual games only need to
 * provide a `setup` function. The helper owns the React/ZIM lifecycle:
 * mounting the holder div, creating the Frame, and disposing on unmount.
 */
export function createZimGame({
  id,
  width,
  height,
  color = "#fff3d3",
  outerColor = "#151019",
  scaling,
  setup,
}) {
  //This lets any ZIM game receive app-level props such as authUser.
  function ZimGameComponent(props = {}) {
    const holderRef = useRef(null);
    // Track whether this effect instance has already initialized ZIM.
    // Guards against React StrictMode's double-invoke of effects.
    const initializedRef = useRef(false);

    useEffect(() => {
      // StrictMode runs effects twice (mount→unmount→mount).
      // Skip the second invocation if ZIM is already running in this mount.
      if (initializedRef.current) return undefined;
      if (!holderRef.current) return undefined;

      initializedRef.current = true;

      const holder = holderRef.current;
      let frame = null;
      let setupCleanup = null;
      let disposed = false;

      function ready() {
        if (disposed) return;

        const start = () => {
          if (disposed) return;
          const cleanup = setup({
            frame,
            stage: frame.stage,
            W: frame.width,
            H: frame.height,
            zim,
            props,
            ...props,
            isDisposed: () => disposed,
          });

          if (typeof cleanup === "function") {
            setupCleanup = cleanup;
          }
        };

        if (document.fonts?.ready) {
          document.fonts.ready.then(start);
        } else {
          start();
        }
      }

      try {
        frame = new zim.Frame({
          scaling: scaling || id,
          width,
          height,
          color,
          outerColor,
          ready,
          allowDefault: true,
        });
      } catch (err) {
        console.error("[ZimGame] Frame creation failed:", err);
      }

      return () => {
        disposed = true;
        initializedRef.current = false;

        if (setupCleanup) {
          try {
            setupCleanup();
          } catch (err) {
            console.warn("[ZimGame] Setup cleanup error (safe to ignore):", err.message);
          }
          setupCleanup = null;
        }

        try {
          if (frame) {
            const stage = frame.stage;
            if (stage) {
              stage.removeAllChildren?.();
              stage.removeAllEventListeners?.();
              stage.update?.();
            }
            frame.dispose();
            frame = null;
          }
        } catch (err) {
          // ZIM dispose can throw if the canvas was already removed
          console.warn(
            "[ZimGame] Dispose error (safe to ignore):",
            err.message,
          );
        }

        if (holder) {
          holder.querySelectorAll?.("canvas").forEach((canvas) => {
            const context = canvas.getContext?.("2d");
            context?.clearRect(0, 0, canvas.width, canvas.height);
          });

          while (holder.firstChild) {
            holder.removeChild(holder.firstChild);
          }
        }
      };
    }, []);

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

  ZimGameComponent.displayName = `ZimGame(${id})`;
  return ZimGameComponent;
}
