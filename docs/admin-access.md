# Admin Access - how the admin gate works

This explains how we lock the admin area (`/admin` and `/tokenized-editor`) so only
admins can get in. It's meant for whoever inherits this next — read it before you
touch the auth pieces.

## The short version

- There's already an admin page (`AdminPage.jsx`) and a tokenized-story editor. They
  were written by another team, and we didn't change them.
- We added a **gate around them**: you can only reach those pages if your account is
  an admin.
- "Are you an admin?" is answered by **one flag in Firestore**:
  `users/{uid}/private/account.isAdmin`. If it's `true`, you're an admin.

That's the whole idea. The rest is just making sure that flag is checked in the right
places and can't be faked.

## Where "admin" is stored

Firebase has two separate things:

- **Authentication** — who you are (email, password/Google, your UID).
- **Firestore** — a database. This is where the `isAdmin` flag lives, at
  `users/{uid}/private/account`.

Signing in only creates the Authentication record. The Firestore doc is separate (see
"Making someone an admin" below).

## The three layers

We check admin access in three places. Each one matters.

### 1. Firestore rules — so nobody can fake the flag
The security rules (managed in the **Firebase console**, not in this repo) say:

- you can **read** your own `private/account` (so the app can check your own `isAdmin`), but
- you **cannot write** `isAdmin` on yourself.

Only an existing admin (or the server, using the Admin SDK) can set `isAdmin: true`.
This is the part that stops someone from just editing their own record to become an
admin.

### 2. The server — the real lock
Every request to an admin API goes through `server/middleware/requireAdmin.js`. It:

1. reads the caller's Firebase token from the `Authorization: Bearer …` header,
2. verifies it's a real, valid token, and
3. re-reads `isAdmin` from Firestore to be sure.

No valid token → **401**. Valid but not an admin → **403**. This is the layer that
actually protects your data, because it can't be bypassed from the browser.

It's wired up in:
- `server/app.js` — guards `/api/v1/admin/storySets`
- `server/stories/routes/storiesroutes.js` — guards editing a tokenized story (the `PUT`)
- `server/config/firebaseAdmin.js` — sets up the Firebase Admin SDK from a credential

### 3. The client — the nice experience
The browser side just decides what to *show*. `client/src/components/RequireAdmin.jsx`
wraps the admin routes: it reads your `isAdmin` from Firestore and either shows the
admin page or a friendly **"Not authorized"** screen. This is only UX — the server is
what actually keeps non-admins out.

To make the admin page's API calls work without editing the admin team's code, we
attach the Firebase token from the outside with a small fetch wrapper
(`client/src/auth/adminAuthInterceptor.js`, turned on in `main.jsx`). That's why none
of the original admin files needed changes.

## Setup (do this once per environment)

1. **Server credential.** The server needs a Firebase service-account key so it can
   verify tokens and read Firestore. Put it in `server/.env` as
   `FIREBASE_SERVICE_ACCOUNT_JSON` (the whole key JSON on one line). See
   `server/.env.example` for the format and where to download the key.
2. **Firestore rules.** Make sure the rules in the Firebase console are published. The
   `users/{uid}/private/**` part must allow owners to read and block them from writing
   `isAdmin`.

## Making someone an admin

An account is an admin when `users/{uid}/private/account.isAdmin` is `true`.

**Heads up:** this app does **not** create that Firestore doc when someone signs up.
(It only ever used Firebase Authentication — the user docs you see in Firestore were
created by another app in the same shared Firebase project.) So a brand-new account
usually has **no** doc yet, which just means "not an admin." That's fine and safe.

To promote someone:

1. Get their **UID** from Firebase console → **Authentication** (copy icon on their row).
2. In **Firestore**, open (or create) `users/{uid}/private/account`.
3. Set the field **`isAdmin`** to the boolean **`true`** (not the text "true").

If the doc doesn't exist yet, create it: add a document under `users` with the UID as
its ID, then a `private` sub-collection with an `account` document holding
`isAdmin: true` (and optionally `email`).

## Testing it locally

```bash
cd server && npm run dev
cd client && npm run dev
```

- Sign in as an **admin** account → `/admin` loads and the Story Set buttons work.
- Sign in as a **non-admin** → `/admin` shows "Not authorized," and admin API calls
  come back **403**.

If an admin gets bounced, it's almost always one of: the Firestore rules aren't
published, the server is missing `FIREBASE_SERVICE_ACCOUNT_JSON`, or that account's
`account` doc doesn't have `isAdmin: true`.

## File map (quick reference)

| Piece | File |
|-------|------|
| Read my `isAdmin` (client) | `client/src/auth/adminClient.js` |
| Show/hide the admin page | `client/src/components/RequireAdmin.jsx` |
| Attach token to admin API calls | `client/src/auth/adminAuthInterceptor.js` (installed in `main.jsx`) |
| Gate the routes | `client/src/App.jsx` and `client/src/admin.jsx` |
| Firestore access (client) | `client/src/auth/firebaseConfig.js` (`db`) |
| The real server check | `server/middleware/requireAdmin.js` |
| Firebase Admin SDK setup | `server/config/firebaseAdmin.js` |
| Where the guard is applied | `server/app.js`, `server/stories/routes/storiesroutes.js` |
| Server credential | `server/.env` (`FIREBASE_SERVICE_ACCOUNT_JSON`), see `server/.env.example` |
| The rules | Firebase console → Firestore → Rules |

## Why we built it this way (so you don't undo it by accident)

- **We didn't touch the admin page or its services** - they belong to another team, so
  the gate is built entirely around them (the fetch interceptor is the trick that makes
  this possible).
- **The client check is just for looks; the server check is the real security.** Never
  rely on hiding the page alone.
- **`/admin` has two entry points** - the normal app route (via `App.jsx`) and a
  standalone dev entry (`admin.html` → `admin.jsx`). Both are gated. If you ever see
  the admin page load *without* a login, check that both are still wrapped in
  `RequireAdmin`.
