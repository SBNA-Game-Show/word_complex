# Daily streak (client side)

This is the front end half of the daily streak. The server owns the real numbers and the rules. This folder's job is to fetch that state, hold onto it while the app is open, and hand it to whatever part of the screen needs it.

The whole feature talks to the rest of the app through one hook: `useProgress()`. A component that wants the streak or the star count just asks for it. It never calls the server itself and never knows the data came from an API. If we ever moved the storage somewhere else, none of the screens would notice.

## What each file does

- `progressService.js` is the only thing here that actually talks to the server. It has a small function for each call: load the config, register today's visit, buy a character. It also has a warm up ping (more on that below).
- `ProgressContext.jsx` is the brain. When someone signs in, it loads the config once and registers their visit, then keeps the result in memory and exposes `useProgress()`. That hook gives you the streak, the star count, the owned characters, a couple of helpers like `isOwned` and `buyCharacter`, and the "you just earned stars" moment.
- `StreakToast.jsx` and `StreakToast.css` are the little popup that slides in when a new day's reward lands. It reads the reward straight from the hook and dismisses itself, so you just drop `<StreakToast />` somewhere and forget about it.
- `index.js` is the front door. Other files import from `../progress`, not from the individual files.

## How it's wired into the app

In `App.jsx` the whole app is wrapped in `<ProgressProvider>`, sitting just inside the auth provider so it can see who's logged in. The toast is rendered once at the top so it can show up on any screen. The launcher's navbar reads the streak and star count from the hook.

## The visit only happens once

When you sign in, we register the visit exactly one time for that session. React likes to mount things twice during development, so there's a small guard that stops a second visit from firing. Even if one slipped through it wouldn't matter, because the server ignores a repeat visit on the same day. Belt and suspenders.

## About the slow backend

The server is hosted on Render, which puts the backend to sleep when nobody's using it. The first request after that can take the better part of a minute while it wakes back up. Left alone, that would mean the navbar shows a zero streak for a while right after login, which looks like the streak got wiped even though it didn't.

Three small things smooth that over:

- The moment the page loads, before anyone even logs in, we send a throwaway request to wake the server up. By the time you've signed in and picked a story, it's usually already awake. If that ping fails, we don't care, it was only a head start.
- The load and visit calls retry a couple of times if the server is still waking up. A purchase does not retry, since by then the server is awake and retrying a "spend stars" action is asking for trouble.
- While the numbers are still loading, the navbar shows a gentle "Loading streak" instead of a bare zero, so it never looks like lost progress.

## What's here and what's coming

The buying function is written and ready, but the character screen doesn't call it yet. That's the next piece of work: showing the locked characters, their prices, and a buy button. The streak screen that shows the full reward ladder is coming too. The backend already supports both, so those are front end only.
