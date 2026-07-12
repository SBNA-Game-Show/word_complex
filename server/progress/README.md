# Daily streak (server side)

This folder is everything the server knows about the daily streak. It keeps track of three things for each player: how long their streak is, how many stars they have, and which characters they own.

All of it lives in one MongoDB collection called `progress`, with one document per user. That's the important part to trust: this code only ever reads and writes the `progress` collection. It never looks at `players`, `tokenized_stories`, or anything else. The streak feature can't accidentally change other data because it has no way to reach it.

## The idea in a minute

Every time a player opens the app, the client calls `POST /visit`. The server checks when they last showed up:

- Same day already? Nothing happens, no free stars twice.
- Yesterday? The streak goes up by one and they earn today's stars.
- Longer gap, or brand new? The streak starts over at one.

Stars pile up. Some characters you buy with those stars, and a couple you get for free just by reaching day 10 and day 20.

## What each file does

- `progressConfig.js` is the one place all the numbers live. The reward curve, the character prices, which characters are free, which ones are gifts at day 10 and 20. If you ever want to make the game more or less generous, change it here and nothing else needs to move.
- `progressLogic.js` is the actual streak math, written as plain functions with no database anywhere near them. Given "here's the last visit date and the current streak," it tells you the new streak and how many stars were earned. Because it doesn't touch the database, it's easy to test and easy to read.
- `db/progressCollection.js` is the only door to the database. It hands back the `progress` collection and nothing else.
- `service/progressService.js` is the part that puts it together: read the player's document, ask the logic what should happen, save the result. It also handles buying a character (check the price, check they can afford it, check they don't already own it, then save).
- `controller/progressController.js` and `routes/progressRoutes.js` are the thin HTTP layer that turns web requests into service calls.

## The API

Everything is mounted under `/api/v1/progress`.

- `GET /` with `?uid=<firebase uid>` gives back a player's current streak, stars, and owned characters. Read only, changes nothing.
- `GET /config` returns the reward ladder, prices, and gift days. The client uses it to draw the streak screen without hardcoding the same numbers twice.
- `POST /visit` with `{ uid }` is the daily check in. It moves the streak forward and awards stars, then returns the new state plus what just happened so the app can show a little celebration.
- `POST /buy` with `{ uid, characterId }` spends stars to unlock a character.

## A few things worth knowing

Who is who: a player is identified by their Firebase user id, which the client sends along. The server does not verify a login token yet. That's not an oversight specific to this feature, the leaderboard works the same way for now, and it's meant to be tightened once the app settles on how auth should work.

No database setup: you don't need to create anything in MongoDB Atlas. The `progress` collection appears on its own the first time a player visits, because the save uses an upsert. Every lookup is by the user id, which is the document key, so there are no extra indexes to build either.

Guests: a guest gets a real (anonymous) user id, so they earn streaks like anyone else while they stay signed in on the same browser. The catch is that logging out deletes the guest account, so their progress is left behind and a new guest login starts fresh. That's a product decision in the auth code, not something this folder does.

Resetting: "a day" means a local calendar day, so the streak rolls over at midnight. Two visits in the same day count as one.

## Tests

`progressLogic.test.js` covers the streak math directly: the reward going up each day and then capping, a repeat visit doing nothing, a missed day resetting, and the day 10 and day 20 gifts.

`service/progressService.test.js` covers the save-and-load path against a small in-memory stand in for MongoDB (the same trick the rest of the server's tests use), including the buying rules.

Run them with `npm test` from the `server` folder, or just this feature with `npx jest progress`.
