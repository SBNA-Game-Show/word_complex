# Adding a Character (Reading Buddies)

This is a guide for anyone who wants to add a new character to the game. Good news:
it's genuinely easy. Adding a buddy is basically **one image + one small edit**, and
if you want players to be able to *get* the buddy, one more line.

## What a character actually is

Characters are the "reading buddies" you see on the **Pick a Character** screen
(`Choose Character` from the main menu). Every character has:

- a picture,
- a name and a little tag line ("The Wise"),
- two colors that make its card glow, and
- a way for players to get it (free, buy with stars, or unlock with a streak).

## The one rule to remember: the `id`

Every character has an `id` (like `tomely`, `cap`, `luna`). That `id` is the glue —
the **same** id is used for the picture filename, the roster entry, and the economy
config. If they don't match exactly, the character won't show up correctly. Pick a
short, lowercase id and use it everywhere.

## Step 1 — Add the picture

Drop a `.webp` image into:

```
client/public/characters/<id>.webp
```

So a character with id `ziggy` needs `client/public/characters/ziggy.webp`. Match the
look/size of the existing ones (open `tomely.webp` for reference — transparent
background, character centered). That's the only asset you need; the app builds the
image path automatically from the id (`/characters/<id>.webp`).

> You do **not** need to touch the image preload list. `client/src/preloadImages.js`
> builds itself from the roster, so a new character is warmed up automatically.

## Step 2 — Add it to the roster

Open `client/src/components/CharacterSelect.jsx` and add an entry to the `CHARACTERS`
array near the top:

```js
export const CHARACTERS = [
  // ...existing buddies...
  {
    id: "ziggy",        // must match the image filename and the config below
    name: "Ziggy",      // shown on the card
    tag: "The Zappy",   // little subtitle under the name
    c: "#ffd166",       // main accent color (card glow / gradient)
    c2: "#f4a300",      // second accent color
  },
];
```

That's all the front end needs. If you stopped here, the buddy would appear on the
screen but be permanently **Locked** (no way to get it) — so do Step 3 too.

## Step 3 — Decide how players get it

How a character is unlocked lives in **one** file on the server:

```
server/progress/progressConfig.js
```

Pick one of these (add your `id`):

- **Free from day one** — add the id to `FREE_CHARACTERS`:
  ```js
  const FREE_CHARACTERS = ["tomely", "sprout", "bubbles", "ziggy"];
  ```
- **Buyable with stars** — add it to `CHARACTER_PRICES` with a price:
  ```js
  const CHARACTER_PRICES = { cap: 30, bolt: 55, berry: 85, ziggy: 60 };
  ```
- **Streak reward** — add it to `MILESTONE_GIFTS`, keyed by the streak day it's gifted:
  ```js
  const MILESTONE_GIFTS = { 10: "luna", 20: "comet", 30: "ziggy" };
  ```

Only pick **one**. If you don't add the id to any of these, the card shows a padlock
with no way to earn it.

Why the server and not the client? The prices, freebies, and streak rewards are the
"economy," and the server is the source of truth so nobody can cheat. The client just
displays whatever the server sends it (`/api/v1/progress/config`), so you don't edit
prices in two places.

## That's it

Three small changes and you're done:

| # | What | Where |
|---|------|-------|
| 1 | The picture | `client/public/characters/<id>.webp` |
| 2 | The card (name, tag, colors) | `CHARACTERS` in `client/src/components/CharacterSelect.jsx` |
| 3 | How to get it | `FREE_CHARACTERS` / `CHARACTER_PRICES` / `MILESTONE_GIFTS` in `server/progress/progressConfig.js` |

## See it

```bash
cd server && npm run dev     # nodemon reloads when you edit progressConfig.js
cd client && npm run dev
```

Sign in, open **Choose Character**, and your buddy should be on the shelf — free,
with a price tag, or with a "Reach day N" note, depending on Step 3.

## A couple of things worth knowing

- **Ownership is per player.** When someone buys or is gifted a character, it's saved
  to their record in the `progress` collection (`ownedCharacters`, keyed by their
  Firebase UID). Free characters are always considered owned — they aren't stored.
- **Restart / let nodemon reload the server** after editing `progressConfig.js`, or the
  client will still see the old prices from `/config`.
- **The id is case-sensitive and must match everywhere** (image name, roster, config).
  99% of "my character won't buy" or "shows a broken image" problems are an id typo.
- The colors (`c`, `c2`) are just for the card's glow/gradient — pick something that
  fits the character. Anything valid CSS works.
