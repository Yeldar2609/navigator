# Handoff — Kim Bolam

Everything a new owner needs to run, deploy, and operate the app.

## Live URLs & consoles
- **Production (public):** https://kimbolam--kim-bolam.europe-west4.hosted.app
- App Hosting backend: `kimbolam` (region `europe-west4`, `nodejs24`), repo `Yeldar2609/navigator`,
  live branch `worktree-day-6-build`, automatic rollouts on push.
- Health: `GET /api/health` → 200 · Version: `GET /api/version` →
  `{ env: production, backend: firebase, aiCounselor: disabled }`.
- Firebase console: https://console.firebase.google.com/project/kim-bolam/overview
  - App Hosting → backend `kimbolam` (rollouts, logs)
  - Authentication (Email/Password + Google enabled)
  - Firestore (Native, europe-west1) · Storage (`kim-bolam.firebasestorage.app`, europe-west1)
- Google Cloud console: https://console.cloud.google.com/home/dashboard?project=kim-bolam
  - Cloud Run service `kim-bolam` (europe-west1) — private alternate/backup.

## Run locally
```bash
npm install
gcloud auth application-default login        # one-time, gives the Admin SDK ADC locally
# copy .env.example -> .env.local and fill the NEXT_PUBLIC_FIREBASE_* web config
npm run dev                                  # http://localhost:3000  (default locale /ru)
```
- Zero-setup UI work: run with no Firebase config → **demo mode** (localStorage, no auth). Demo mode
  is fail-closed in production.
- Against emulators: `firebase emulators:start` (ports in `firebase.json`).
- Checks: `npm run typecheck`, `npm run lint`, `npm run test`.

## Deploy
- **Public (App Hosting):** push to `worktree-day-6-build` → automatic rollout. Manual re-deploy:
  `firebase apphosting:rollouts:create kimbolam`.
- **Rules:** `firebase deploy --only firestore:rules,firestore:indexes,storage`.
- **Private alternate (Cloud Run):** see `DEPLOYMENT_FINAL.md` Path B.
- **Rollback:** see `ROLLBACK.md`.

> Org note: Cloud Run **cannot** be made public (DRS blocks `allUsers`). App Hosting is the public
> path. Admin credentials are **ADC**, not a key file (org blocks downloadable keys).

## Enable the AI counselor later (currently disabled)
1. Create a Dialogflow CX agent (see `CONVERSATIONAL_AGENT_SETUP.md`).
2. Set server env (App Hosting backend or Cloud Run):
   `ENABLE_AI_COUNSELOR=true`, `DIALOGFLOW_CX_PROJECT_ID=kim-bolam`,
   `DIALOGFLOW_CX_LOCATION=<region>`, `DIALOGFLOW_CX_AGENT_ID=<agent-id>`.
3. Redeploy. `/api/version` should then report `aiCounselor: enabled`. Guardrails + safety run
   regardless; only minimal, non-PII context is sent (`lib/ai/context-builder.ts`). Kazakh responses
   need additional QA.

## Bootstrap the first admin (custom claim)
Admin authorization is a Firebase custom claim `admin: true`, checked server-side. Run once with the
Admin SDK under ADC:
```js
const { getAuth } = require('firebase-admin/auth')
await getAuth().setCustomUserClaims('<uid>', { admin: true })
```
The user must re-login to refresh their token. Admins operate only through authorized server routes;
they never receive client access to student chats. (Note: the admin dashboard currently reads
Supabase — a post-launch cutover; see `POST_LAUNCH_BACKLOG.md`.)

## Test account note
Auth is verified live end-to-end: a real user can sign up (Email/Password or Google) and onboarding
writes `users/{uid}` to Firestore under owner-only rules. Create a throwaway test account via the
live sign-up to exercise the flow; the unauthenticated preview tier also works without an account.

## Key file map
| Path | Purpose |
|---|---|
| `apphosting.yaml` | App Hosting config (public env only; no secrets) |
| `cloudbuild.yaml` / `Dockerfile` | Cloud Run image build (private alternate) |
| `firebase.json` / `.firebaserc` | Firebase project + emulators + hosting rewrite |
| `firestore.rules` / `storage.rules` / `firestore.indexes.json` | security rules + indexes |
| `next.config.mjs` | `standalone` output + `/careers`→`/career-explorer` redirect |
| `app/robots.ts` + `app/[lang]/layout.tsx` | noindex (robots + metadata) and branding/title |
| `lib/env.ts` | typed env, fail-closed, ADC + feature gates |
| `lib/firebase/admin.ts` / `client.ts` / `firestore.ts` | Admin/client SDK + data layer |
| `lib/data/mode.ts` | demo vs Firebase mode resolution |
| `lib/ai/*` | counselor guardrails, policy, context builder, Dialogflow client |
| `app/api/health` · `app/api/version` · `app/api/chat` | health, build info, counselor route |
| `docs/` | this handoff set + Day 1–7 notes |
