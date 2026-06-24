import { useEffect } from "react";
import { CHARACTERS } from "./components/CharacterSelect";
import { sceneConfigs } from "./scenes/sceneConfig";

// Asset warm-up list
// ------------------
// The heavy art (character roster + game environment backgrounds) lives in
// /public and is only requested the moment its screen mounts. On a deployed
// build that means the image streams in over the network and "pops" in chunks
// behind the entrance animations. Warming the browser cache ahead of time turns
// those later requests into instant cache hits.
//
// Built from the same sources the UI renders from, so adding a character or a
// scene automatically adds it here — no second list to keep in sync.
export const PRELOAD_IMAGES = [
  ...CHARACTERS.map((c) => `/characters/${c.id}.webp`),
  ...Object.values(sceneConfigs).map((s) => s.background),
  "/scenes/house-inside.webp", // Character-select room backdrop (CSS background)
];

// Kick off background downloads for `urls` once `enabled` is true. The browser
// caches each fetch, so the real <img>/CSS request later resolves instantly.
export function usePreloadImages(urls = PRELOAD_IMAGES, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const images = urls.map((url) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      return img;
    });
    // Drop references so in-flight loads can be abandoned if we unmount.
    return () => images.forEach((img) => { img.src = ""; });
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps -- urls is module-stable
}
