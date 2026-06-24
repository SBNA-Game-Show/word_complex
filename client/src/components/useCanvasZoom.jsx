import { useEffect, useState } from "react";

// Canvas zoom limits, shared by every game's +/- controls.
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

// Persist the chosen zoom so it carries across every game/page and survives
// reloads. One shared value (not per-game) so the whole app feels consistent.
const ZOOM_STORAGE_KEY = "wc:canvasZoom";

function readStoredZoom() {
  if (typeof window === "undefined") return 1;
  const stored = Number(window.localStorage.getItem(ZOOM_STORAGE_KEY));
  if (!Number.isFinite(stored) || stored <= 0) return 1;
  // Clamp in case the stored value predates the current limits.
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, stored));
}

/**
 * useCanvasZoom
 * -------------
 * Shared manual zoom for ZIM game canvases, used by both wrappers (GameScreen
 * and GameScene). Returns:
 *   - `zoom`: the current scale (1 = 100%). Apply it to a canvas ancestor as the
 *     CSS variable `--canvas-zoom` (App.css transforms the canvas by it).
 *   - `controls`: the ready-to-render +/- / Reset control pill.
 *
 * The level is persisted to localStorage, so it is remembered for the user
 * across every game/page and between sessions. This resizes the canvas purely in
 * CSS, without touching ZIM gameplay coordinates or game logic.
 */
export function useCanvasZoom() {
  const [zoom, setZoom] = useState(readStoredZoom);

  // Save whenever the user changes the zoom.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ZOOM_STORAGE_KEY, String(zoom));
  }, [zoom]);

  const zoomOut = () =>
    setZoom((current) => Math.max(ZOOM_MIN, Number((current - ZOOM_STEP).toFixed(2))));
  const zoomIn = () =>
    setZoom((current) => Math.min(ZOOM_MAX, Number((current + ZOOM_STEP).toFixed(2))));
  const reset = () => setZoom(1);

  const controls = (
    <div className="canvas-zoom-controls" aria-label="Canvas zoom controls">
      <button
        type="button"
        onClick={zoomOut}
        disabled={zoom <= ZOOM_MIN}
        aria-label="Zoom out"
        title="Zoom out"
      >
        −
      </button>

      <span aria-live="polite">{Math.round(zoom * 100)}%</span>

      <button
        type="button"
        onClick={zoomIn}
        disabled={zoom >= ZOOM_MAX}
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>

      <button type="button" onClick={reset} aria-label="Reset zoom" title="Reset zoom">
        Reset
      </button>
    </div>
  );

  return { zoom, controls };
}
