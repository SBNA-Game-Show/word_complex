# Art, Preloading, and the Loading Screen

The game uses a lot of art: the character roster and the game backgrounds. On a
deployed build, big images used to "pop in" chunk by chunk, which looked rough. This
explains how we fixed that and how to keep it working when you add new art.

There are two parts: **compress the art**, and **preload it** so it is already in the
browser cache by the time a screen needs it.

## Part 1: Compress the art (PNG to WebP)

Source art is drawn as PNG, but we ship **WebP**. WebP at quality 90 looks the same to
the eye but is roughly 10-16x smaller, which is what stops the slow pop-in.

There is a script that does the conversion for you:

```bash
cd client
npm run optimize:images
```

It looks in `public/characters` and `public/scenes`, and writes a `.webp` next to every
`.png`. The console prints each file's new size.

### When you add or replace art

1. Drop your `.png` into `public/characters/` (a buddy) or `public/scenes/` (a game
   background).
2. Run `npm run optimize:images`.
3. Commit the generated `.webp` files.

The app's code always points at the `.webp`, so the `.png` is not shipped. You can keep
the PNGs around as editable sources or delete them - either is fine, they are not part
of the deployed bundle.

## Part 2: Preload it in the background

Even compressed, an image only downloads the moment its screen opens, which can still
cause a small flash. So we warm the browser cache ahead of time.

This lives in `client/src/preloadImages.js`. The nice part: the list of what to preload
is **built automatically** from the same sources the UI uses:

- every character in `CHARACTERS` (from `CharacterSelect.jsx`),
- every scene background in `sceneConfig.js`, and
- the character-select room backdrop.

Because it builds itself from those, **adding a character or a scene automatically adds
it to the preload list**. There is no second list to keep in sync.

The warm-up kicks off quietly once the user is signed in (`usePreloadImages` is called
in `App.jsx`), so by the time they open Choose Character or launch a game, the images
are already cached and appear instantly.

You normally never touch this file. The only reason to edit it would be to preload some
brand-new kind of art that is not a character or a scene.

## The loading screen

When the app first loads, Firebase takes a moment to check if you are already signed in.
During that moment we show a friendly splash instead of flashing the login screen:

> **Word Complex** - Getting your adventure ready...

That splash lives in `App.jsx` (shown while `isInitializing` is true) and its styles are
the `.auth-splash` / `.splash-word` / `.splash-sub` classes in `App.css`. It has a soft
shine animation, and it respects "reduce motion" settings by holding still. If you want
to change the loading text or look, that is where to do it.

## Quick reference

| I want to... | Do this |
|--------------|---------|
| Add/replace character or scene art | Drop the `.png`, run `npm run optimize:images`, commit the `.webp` |
| Preload a new character/scene | Nothing - it is automatic once it is in `CHARACTERS` or `sceneConfig.js` |
| Change the loading splash | Edit the `.auth-splash` block in `App.jsx` / `App.css` |

## Things worth knowing

- If art looks huge on the network tab or pops in slowly, someone probably added a
  `.png` and forgot to run `npm run optimize:images` (or forgot to commit the `.webp`).
- WebP is what actually ships. The code references `.webp`, so a missing `.webp` shows a
  broken image even if the `.png` is right there.
- The preload is best-effort and quiet. If it fails (bad network), the app still works;
  the image just loads normally when its screen opens.
