# Adding a New Game

Follow these steps to add your game to the platform. Once done, it will automatically appear as a playable card on the launcher — no one else's code needs to change.

---

## Folder Structure

Each game lives in its own folder here and in the server. The pattern to follow:

```
client/src/games/
└── YourGame/
    └── index.jsx        ← your game component + meta export

server/
└── yourgame/
    ├── controller/
    │   └── yourgamecontroller.js
    └── routes/
        └── yourgameroutes.js
```

---

## Step 1 — Create the frontend game file

Create `client/src/games/YourGame/index.jsx`.


It must export two things:

**1. A `meta` object (named export)**
```jsx
export const meta = {
  id: "your-game-id",       // kebab-case, used for routing
  cardNumber: "02",          // display order on the launcher (01–04)
  cardArt: "art-sea",        // CSS class for the card background art
  title: "Your Game Title",
  description: "One sentence description shown on the launcher card.",
};
```

Available `cardArt` values: `art-meadow`, `art-sea`, `art-night`, `art-hunt`

**2. A default React component**
```jsx
export default function YourGame() {
  // your game UI here
  // use createZimGame (from ../createZimGame.jsx) if building a ZIM canvas game
}
```

---

## Step 2 — Register it in the registry

Open [`index.js`](./index.js) and add your import + entry:

```js
//at the top of the index.js file:
import YourGame, { meta as yourGameMeta } from "./YourGame";

//in the function inside index.js, just add the line similar to how the other two games are
export const games = [
  ...
  { ...yourGameMeta, Component: YourGame },   // ← add this line
];
```

That's all the frontend needs. The launcher will automatically show your card as playable.

> If your game isn't ready yet, add an entry **without** `Component` and it will show as a locked "Coming soon" card automatically:
> ```js
> { id: "your-game-id", cardNumber: "02", cardArt: "art-sea", title: "...", description: "..." }
> ```

---

## Step 3 — Create the backend game folder

Create your game folder in `server/` following this structure:

**`server/yourgame/routes/yourgameroutes.js`**
```js
const express = require("express");
const router = express.Router();
const { getGameData } = require("../controller/yourgamecontroller");

router.get("/", getGameData);

module.exports = router;
```

**`server/yourgame/controller/yourgamecontroller.js`**
```js
async function getGameData(req, res) {
  try {
    // return your game data
    res.json({ ... });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getGameData };
```

---

## Step 4 — Register the backend route

Open `server/app.js` and add two lines:

```js
const yourGame = require("./yourgame/routes/yourgameroutes");  // ← import
app.use("/api/v1/yourGame", yourGame);                          // ← register
```

---

## Step 5 — Add the API call to the frontend service

Open `client/src/services/api.js` and add a fetch function:

```js
export async function getYourGameData() {
  const response = await fetch(`${API_BASE}/yourGame`);
  if (!response.ok) throw new Error("Failed to fetch game data");
  return response.json();
}
```

Then import and call it from your game component.

---

## Summary checklist

- [ ] `client/src/games/YourGame/index.jsx` — meta export + default component
- [ ] `client/src/games/index.js` — import and register with `Component`
- [ ] `server/yourgame/controller/yourgamecontroller.js` — game logic
- [ ] `server/yourgame/routes/yourgameroutes.js` — route definition
- [ ] `server/app.js` — import and mount the route
- [ ] `client/src/services/api.js` — fetch function for your endpoint
