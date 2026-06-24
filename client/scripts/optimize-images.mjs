// Image optimizer
// ---------------
// Converts the source PNG art in public/characters and public/scenes to
// high-quality WebP. WebP at quality 90 is visually indistinguishable from the
// original PNGs but ~10-16x smaller, which is what keeps the character picker
// and game environments from "popping in" chunk-by-chunk on a deployed build.
//
// Usage:  npm run optimize:images   (from the client/ folder)
//
// It writes a .webp next to each .png. Re-run it whenever you add or replace art
// in those folders, then commit the generated .webp files. The original .pngs
// are no longer shipped (code references .webp), so you can keep them around as
// editable sources or remove them — they are not part of the deployed bundle.

import { readdir } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const QUALITY = 90; // visually lossless for this art; bump up for finer detail
const EFFORT = 6; // 0-6, higher = smaller files / slower encode

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dirs = ["public/characters", "public/scenes"];

let total = 0;
for (const dir of dirs) {
  const abs = join(root, dir);
  const files = (await readdir(abs)).filter((f) => extname(f).toLowerCase() === ".png");
  for (const file of files) {
    const src = join(abs, file);
    const out = src.replace(/\.png$/i, ".webp");
    const info = await sharp(src).webp({ quality: QUALITY, effort: EFFORT }).toFile(out);
    console.log(`${dir}/${file} -> ${(info.size / 1024).toFixed(0)} KB`);
    total += info.size;
  }
}
console.log(`\nDone. Total WebP: ${(total / 1024).toFixed(0)} KB`);
