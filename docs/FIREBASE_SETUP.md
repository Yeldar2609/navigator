# Firebase Setup — Kim Bolam

Firebase project: **kim-bolam**. This app uses **Auth** (sign-in), **Firestore** (primary DB),
and **Cloud Storage** (private PDF reports). Supabase is legacy/fallback only.

## 1. Web app config (client)
Console → Project settings → *Your apps* → Web app → register "Kim Bolam Web". Copy the config into
these env vars (store as secrets in prod; see `SECRETS_SETUP.md`):

| Env var | From config |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` (= `kim-bolam`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` (= `887167045950`) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

The client SDK is wired in `lib/firebase/client.ts` and returns `null` until configured, so the app
degrades gracefully (unauthenticated preview tier) instead of crashing.

## 2. Admin credentials (server) — ADC, no key file

> This org enforces `constraints/iam.disableServiceAccountKeyCreation`, so downloadable
> service-account keys are blocked (the console "Generate new private key" fails, and so does
> `gcloud ... keys create` with `FAILED_PRECONDITION`). We therefore use **Application Default
> Credentials (ADC)** — which is also Google's recommended practice (no long-lived key to leak).

- **Production (App Hosting / Cloud Run):** ADC is automatic via the runtime service account
  (`887167045950-compute@developer.gserviceaccount.com` or the App Hosting backend SA). Leave the key
  vars blank. Ensure that SA can reach Firestore + Storage (Editor by default covers it).
- **Local dev:** run once, then ADC just works:
  ```bash
  gcloud auth application-default login
  ```
  `.env.local` already sets `FIREBASE_ADMIN_USE_ADC=true`.
- **Optional explicit key:** if the org policy is ever lifted, set `FIREBASE_ADMIN_CLIENT_EMAIL` +
  `FIREBASE_ADMIN_PRIVATE_KEY` and the code uses the key instead of ADC.
- Bucket: `FIREBASE_STORAGE_BUCKET` / `REPORT_BUCKET` = `kim-bolam.firebasestorage.app`.

Wired in `lib/firebase/admin.ts` (`verifyIdToken`, `getAuthedUser`, `getAdminDb`, `getAdminBucket`) —
explicit key when present, else `applicationDefault()`.

## 3. Enable products
- **Authentication** → Sign-in method → enable **Email/Password** (and Google if wanted).
- **Firestore** → create database (production mode) in a region close to KZ users.
- **Storage** → create the default bucket.

## 4. Deploy rules + indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```
- `firestore.rules` — students reach only `/users/{uid}`; catalogs are public-read; everything else
  is server-only (Admin SDK). **No client path exposes another user's chats, results, or reports.**
- `storage.rules` — `reports/{uid}/**` readable only by that owner; writes are server-only.

## 5. Data model (Firestore)
Per-user private tree under `users/{uid}`:
`assessmentSessions`, `assessmentAnswers`, `assessmentResults` (server-written), `plans` (+ `items`),
`checkIns`, `progressCalendar`, `chatThreads` (+ `messages`), `reports` (metadata).
Public curated catalogs (top-level, read-only): `careerCatalog`, `majorCatalog`, `universityCatalog`,
`courseCatalog`, `assessmentTemplates`, `assessmentItemBank`.
Server-only (Admin SDK): `organizations`, `organizationMembers`, `analyticsEvents`, `auditLogs`,
`adminActions`.

## 6. First admin (custom claim)
Admin authorization uses a Firebase **custom claim** `admin: true`, checked server-side. Bootstrap
the first admin once (Node, with the Admin SDK / a service account):
```js
const { getAuth } = require('firebase-admin/auth')
await getAuth().setCustomUserClaims('<uid>', { admin: true })
```
The user must re-login to refresh their token. Admins operate exclusively through authorized server
routes — they never receive client access to student chats. (Fallback if claims are undesirable: a
server-only `organizationMembers` roles doc checked in the same routes.)

## 7. Local development
Run against the Firebase **emulators** (`firebase emulators:start` — ports in `firebase.json`), or
simply run demo mode (no env) for zero-setup UI work. Demo mode is fail-closed in production.
