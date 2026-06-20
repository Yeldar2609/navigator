# Deployment — Kim Bolam

Project: **kim-bolam** (number `887167045950`), Blaze billing enabled. HTTPS via Google.

There are two supported paths. **Path A (recommended)** = Firebase App Hosting (best fit for
this Next.js App-Router app). **Path B** = Cloud Run container (the included `Dockerfile`).

---

## 0. One-time prerequisites (human — cannot be automated)
These are the blockers that stop a fully-autonomous deploy. Do them once.

1. **Authenticate the CLIs** (interactive):
   ```bash
   firebase login
   gcloud auth login           # ensure gcloud is on PATH first (see GOOGLE_CLOUD_SETUP.md)
   gcloud config set project kim-bolam
   ```
2. **Create a Firebase Web App** to obtain the `NEXT_PUBLIC_FIREBASE_*` values:
   Firebase console → Project settings → *Your apps* → Web → register → copy the config.
   Put the values in Secret Manager (see `SECRETS_SETUP.md`).
3. **Admin credentials — use ADC, not a key.** The org blocks downloadable keys
   (`iam.disableServiceAccountKeyCreation`). Production uses the runtime service account
   automatically; for local/admin tooling run `gcloud auth application-default login`. See
   `FIREBASE_SETUP.md` §2.
4. **Enable Firebase Auth providers**: Authentication → Sign-in method → enable Email/Password
   (and Google if desired).
5. **(Optional, for AI)** create the Dialogflow CX agent — see `CONVERSATIONAL_AGENT_SETUP.md`.
   Until then the counselor ships in its safe disabled/fallback state.

## 1. Deploy security rules (both paths)
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```
This publishes `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.

## 2. Path A — Firebase App Hosting (recommended)
```bash
firebase experiments:enable webframeworks   # if needed
firebase init apphosting                     # link the GitHub repo + branch (one-time)
```
- `apphosting.yaml` is already in the repo: `minInstances: 0`, `maxInstances: 2`, secrets wired by
  name. Create the secrets first (`SECRETS_SETUP.md`), then grant the App Hosting backend access:
  ```bash
  firebase apphosting:secrets:grantaccess NEXT_PUBLIC_FIREBASE_API_KEY FIREBASE_ADMIN_PRIVATE_KEY ...
  ```
- Push to the connected branch (or `firebase deploy`) to trigger a build. App Hosting builds the
  Next.js SSR server and serves it over HTTPS. The public URL is shown in the console / CLI output.

## 3. Path B — Cloud Run container (alternative)
```bash
gcloud builds submit --tag gcr.io/kim-bolam/kim-bolam
gcloud run deploy kim-bolam \
  --image gcr.io/kim-bolam/kim-bolam \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --port 8080 \
  --set-secrets NEXT_PUBLIC_FIREBASE_API_KEY=NEXT_PUBLIC_FIREBASE_API_KEY:latest,FIREBASE_ADMIN_PRIVATE_KEY=FIREBASE_ADMIN_PRIVATE_KEY:latest,FIREBASE_ADMIN_CLIENT_EMAIL=FIREBASE_ADMIN_CLIENT_EMAIL:latest \
  --set-env-vars APP_ENV=production,NEXT_PUBLIC_FIREBASE_PROJECT_ID=kim-bolam
```
The container listens on `0.0.0.0:$PORT` (default 8080) and min-instances is 0.
Note: `NEXT_PUBLIC_*` values are inlined at **build** time, so for Path B they must be present at
`gcloud builds submit` (pass them as build substitutions or bake via Cloud Build), not only at run.

## 4. Post-deploy verification
Hit these on the deployed URL:
- `GET /api/health` → `{"status":"ok",...}`
- `GET /api/version` → shows `env`, `backend` (`firebase` once admin creds are set), `aiCounselor`.
- `/ru` (default), `/kk`, `/en` load. Sign-up → onboarding → assessment → results → plan → check-in.
- AI counselor: opens, refuses out-of-scope, and either answers (agent configured) or shows the
  template fallback (agent not configured) — never a fake "AI" claim.

Full checklist: see the post-deploy section of `DAY_6_NOTES.md`.

## 5. Rollback
- **App Hosting:** console → App Hosting → Rollouts → roll back to the previous rollout. Or redeploy
  a previous commit.
- **Cloud Run:** `gcloud run services update-traffic kim-bolam --to-revisions PREVIOUS=100`.
- **Rules:** re-deploy the previous `firestore.rules`/`storage.rules` from git history.
