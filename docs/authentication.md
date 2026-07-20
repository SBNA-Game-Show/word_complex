# Authentication (Firebase and Google Sign-In)

This explains how people log into the game and how to keep that working. It is
written for the next cohort, so it stays simple and practical.

## What we use

We use **Firebase Authentication**. It handles the login part for us, so we never
store passwords ourselves. There are three ways to sign in:

1. **Google** (the main one): click "Continue with Google", pick your account, done.
2. **Email and password**: normal sign up / sign in with an email.
3. **Guest**: jump in without an account to try the game. Guest accounts are
   temporary and get thrown away on logout.

## The files, and what each one does

There are only four files you need to know. Each has one job.

| File | Job |
|------|-----|
| `client/src/auth/firebaseConfig.js` | Starts Firebase using the config from env vars. Exports `auth` (login) and `db` (Firestore). |
| `client/src/auth/firebaseClient.js` | The actual login actions: Google popup, guest, email sign in/up, logout. Also the friendly error messages. |
| `client/src/auth/AuthContext.jsx` | The React side. Remembers who is signed in and gives components the `useAuth()` hook. |
| `client/src/auth/LoginPage.jsx` | The login screen (the Google button, guest button, and email form). |

If you want to change how login *looks*, edit `LoginPage.jsx`. If you want to change
how login *works*, edit `firebaseClient.js`. If a component needs to know who is
logged in, it calls `useAuth()`.

## How Google sign-in works, step by step

1. On the login screen the user clicks **Continue with Google**.
2. That calls `loginWithGoogle()` from `useAuth()`, which runs `signInWithGoogle()`
   in `firebaseClient.js`. Firebase opens the Google popup.
3. The user picks their Google account and the popup closes.
4. Firebase tells the app "this person is now signed in" through a listener called
   `onAuthStateChanged` (we hook into it in `AuthContext.jsx`).
5. `AuthContext` saves that user, and the whole app re-renders as logged in.

Any component can then read the current user with:

```js
import { useAuth } from "../auth";

const { user, isAuthenticated, logout } = useAuth();
```

## How the app knows who is logged in

`AuthContext` listens to Firebase with `onAuthStateChanged`. This fires:

- once when the page loads (so a refresh keeps you logged in), and
- every time someone signs in or out.

Because Firebase remembers the session in the browser (we turn on
`browserLocalPersistence`), users stay logged in after a refresh. They do not have to
log in every time.

## The Firebase config (env vars)

Firebase needs to know which project to talk to. That comes from six values that live
in `client/.env.local`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Where to get them: Firebase Console, then Project settings, then "Your apps", then the
SDK setup section. Copy each value into `client/.env.local`. There is a template at
`client/.env.example` you can copy from.

Two notes:

- `.env.local` is gitignored, so it never gets committed. That is on purpose.
- These web config values are not really secret (they ship in the browser anyway), but
  we still keep them out of git to stay tidy and avoid confusion.

## Turning Google sign-in on in Firebase (one time)

If Google login ever stops working with a "not enabled" message, check this:

1. Firebase Console, then **Authentication**, then **Sign-in method**.
2. Find **Google** in the list and make sure it is **Enabled**.
3. Set a support email if it asks (usually your own).
4. Save.

The same screen is where **Email/Password** and **Anonymous** (guest) get turned on.
If guest login fails, enable **Anonymous** here.

## Authorized domains (important when you deploy)

Google sign-in only works on domains Firebase trusts. This trips people up after a
deploy.

- `localhost` is trusted by default, so it works while you develop.
- When you deploy (for example to Vercel), add that live domain here:
  Firebase Console, then **Authentication**, then **Settings**, then
  **Authorized domains**, then add your domain.

If Google sign-in works on your machine but not on the deployed site, this is almost
always the reason.

## Maintaining it (common tasks)

- **See who has signed up**: Firebase Console, then Authentication, then the Users tab.
- **Add a new deploy URL**: add it under Authorized domains (see above).
- **Turn a login method on or off**: Authentication, then Sign-in method.
- **Add a brand new sign-in method** (for example Apple or GitHub): enable it in the
  console, then add a matching function in `firebaseClient.js` (copy the pattern of
  `signInWithGoogle`), expose it from `AuthContext.jsx`, and add a button in
  `LoginPage.jsx`.
- **Switch to a different Firebase project**: replace the six `VITE_FIREBASE_*` values
  in `client/.env.local` (and in the host's env settings for the deploy).
- **About guest accounts**: guests use Firebase "anonymous" login. On logout we delete
  the anonymous account on purpose, so the Users list does not fill up with throwaway
  guests.

## Common problems and quick fixes

| What you see | Likely cause and fix |
|--------------|----------------------|
| "That sign-in method isn't enabled yet" | Enable the provider (Google / Email / Anonymous) in Authentication, Sign-in method. |
| Google works locally but not on the live site | Add the live domain under Authorized domains. |
| "Your browser blocked the sign-in popup" | Allow popups for the site, then try again. |
| Guest button fails | Enable Anonymous sign-in in the console. |
| Login screen never loads / config errors | A `VITE_FIREBASE_*` value is missing or wrong in `.env.local`. |

The friendly messages users see for these come from a small lookup called
`toFriendlyError` in `firebaseClient.js`. If you want to reword an error, edit it there.

## Testing note

Automated tests do not use real Firebase. When `VITE_E2E_AUTH_BYPASS=true` is set
(the Playwright config does this), the app skips Firebase and uses a fake test user.
So you can run the tests without any Firebase account or network.

## Related

- Admin access uses this same Firebase login, then checks an `isAdmin` flag. See
  [admin-access.md](admin-access.md).
