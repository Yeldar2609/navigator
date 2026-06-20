# Deployment (Final / Authoritative) — Kim Bolam

This supersedes `DEPLOYMENT.md` for go-live. Project **kim-bolam** (`887167045950`), Blaze.

- **Primary, PUBLIC:** Firebase App Hosting — https://kimbolam--kim-bolam.europe-west4.hosted.app
- **Alternate, PRIVATE:** Cloud Run service `kim-bolam` (europe-west1)

## Why App Hosting is the public path (org DRS limitation)
The organization enforces **Domain Restricted Sharing**
(`constraints/iam.allowedPolicyMemberDomains`). That policy blocks the `allUsers` IAM grant, so a
**Cloud Run service cannot be made public** (`--allow-unauthenticated` is rejected). Firebase App
Hosting serves the app through Firebase's managed infrastructure, which does **not** require an
`allUsers` grant on a Cloud Run service — so it is the one path that is publicly reachable under
this org policy. Cloud Run remains deployed as a private alternate/backup.

---

## Path A — Firebase App Hosting (primary, public)

**Backend:** id `kimbolam`, region `europe-west4`, `nodejs24` runtime.
**Source of truth:** GitHub repo `Yeldar2609/navigator`, live branch `worktree-day-6-build`.
**Rollouts:** automatic on push to the live branch.

### How it builds
On every push to the connected branch, App Hosting:
1. Pulls the commit, reads `apphosting.yaml`.
2. Builds the Next.js App-Router SSR server (its own builder; `output: 'standalone'` in
   `next.config.mjs` is ignored here — it only matters for the Cloud Run/Docker path).
3. Injects the `env:` block from `apphosting.yaml` at BUILD and/or RUNTIME (per `availability`).
4. Creates a new **rollout** and shifts traffic to it.

### Trigger a rollout
- **Automatic:** push to `worktree-day-6-build`.
- **Manual (no code change / re-deploy current commit):**
  ```bash
  firebase apphosting:rollouts:create kimbolam
  ```

### apphosting.yaml (what it contains)
- `runConfig`: `minInstances: 0`, `maxInstances: 2`, `cpu: 1`, `memoryMiB: 512`, `concurrency: 80`.
- `env`: **public values only** —
  - `APP_ENV=production`, `NEXT_PUBLIC_APP_NAME=Kim Bolam`,
    `NEXT_PUBLIC_DEFAULT_LOCALE=ru`, `NEXT_PUBLIC_SUPPORTED_LOCALES=ru,kk,en`
  - the six `NEXT_PUBLIC_FIREBASE_*` web-config values (public by design — they already ship in the
    browser bundle; security is enforced by Firestore/Storage rules)
  - `GOOGLE_CLOUD_PROJECT=kim-bolam`, `REPORT_BUCKET=kim-bolam.firebasestorage.app` (runtime)
- **No secrets**, no service-account key. The Admin SDK uses **ADC** via the App Hosting runtime
  service account.

---

## Path B — Cloud Run container (alternate, PRIVATE)

Service `kim-bolam`, region `europe-west1`. Built from `Dockerfile` (Next.js `standalone`) via
`cloudbuild.yaml`. **Private** — cannot be made public under org DRS (see above).

### Build the image (Cloud Build → Artifact Registry)
`cloudbuild.yaml` bakes the public `NEXT_PUBLIC_*` web config as `--build-arg` (they are inlined
into the client bundle at build time) and pushes:
`europe-west1-docker.pkg.dev/kim-bolam/kim-bolam/app:latest`.

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _FB_API_KEY=<apiKey>,_FB_APP_ID=<appId>,_APP_URL=<public-url>
```

### Deploy the service
```bash
gcloud run deploy kim-bolam \
  --image europe-west1-docker.pkg.dev/kim-bolam/kim-bolam/app:latest \
  --region europe-west1 \
  --min-instances 0 \
  --port 8080 \
  --set-env-vars APP_ENV=production,NEXT_PUBLIC_FIREBASE_PROJECT_ID=kim-bolam,GOOGLE_CLOUD_PROJECT=kim-bolam,REPORT_BUCKET=kim-bolam.firebasestorage.app
```
Notes:
- **Do not** pass `--allow-unauthenticated` — org DRS rejects the `allUsers` grant. The service
  stays private (callable by authorized principals / service accounts only).
- Admin SDK uses **ADC** via the Cloud Run runtime service account — no key var needed.
- The container listens on `0.0.0.0:$PORT` (default `8080`); min-instances `0`.

---

## Security rules (both paths)
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```
Publishes `firestore.rules`, `firestore.indexes.json`, `storage.rules`. Firestore (Native) and the
default bucket `kim-bolam.firebasestorage.app` are in `europe-west1` (permanent).

## Post-deploy verification
- `GET /api/health` → `200`.
- `GET /api/version` → `{ env: production, backend: firebase, aiCounselor: disabled }`.
- `/ru` `/kk` `/en` and student routes → `200`.
- Sign-up → onboarding writes `users/{uid}` (rules enforce owner-only).

Rollback procedures: see `ROLLBACK.md`.
