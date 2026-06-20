# Day 7 Notes — Public Release Stabilization & Go-Live

> Branch `worktree-day-6-build` · Project `kim-bolam` (`887167045950`), Blaze.
> Goal: take the Day-6 build from "deployable" to **live and public**, with an honest handoff.

## Outcome

**Production is LIVE and public:**
https://kimbolam--kim-bolam.europe-west4.hosted.app

Served by **Firebase App Hosting** (backend id `kimbolam`, region `europe-west4`, `nodejs24`
runtime), connected to GitHub repo `Yeldar2609/navigator`, live branch `worktree-day-6-build`,
with automatic rollouts on push.

## What Day 7 did

### Route audit + fixes
- **Branding**: app metadata title is now `Kim Bolam` (`app/[lang]/layout.tsx` →
  `title.default = 'Kim Bolam'`, template `%s · Kim Bolam`). Lingering "Navigator" branding in
  user-facing metadata removed.
- **`/careers` redirect**: `next.config.mjs` redirects `/:lang/careers` → `/:lang/career-explorer`
  (temporary/302) so the public-facing name resolves to the real route.
- **robots noindex**: kept the app out of search until the team is ready —
  `app/robots.ts` disallows all (`{ userAgent: '*', disallow: '/' }`) and the page metadata sets
  `robots: { index: false, follow: false }`. Belt-and-suspenders.
- Student-flow route audit across `/ru` `/kk` `/en` (loads, empty/error states, one CTA, no demo
  copy, no missing i18n keys); auth redirect logic checked for loops.

### Deployment
- **App Hosting (primary, public)** — builds the Next.js SSR server from the connected branch on
  every push; `apphosting.yaml` carries the public Firebase web config as plain values (no secrets;
  Admin SDK uses ADC). This is the public path.
- **Cloud Run (alternate, private)** — service `kim-bolam` in `europe-west1`, built from
  `cloudbuild.yaml` + `Dockerfile`. It is **private**: the org enforces Domain Restricted Sharing
  (`iam.allowedPolicyMemberDomains`), which blocks the `allUsers` grant, so Cloud Run cannot be made
  public. Documented as the alternate/backup; App Hosting is how the public is served.
- Firestore + Storage security rules deployed. Firestore (Native) + the default Storage bucket
  (`kim-bolam.firebasestorage.app`) live in `europe-west1` (permanent).

### Verification (live)
- `GET /api/health` → `200`.
- `GET /api/version` → `{ env: production, backend: firebase, aiCounselor: disabled }`.
- `/ru` (default), `/kk`, `/en` → `200`; student routes → `200`.
- Auth verified end-to-end: a real user signs up (Email/Password and Google both enabled) and
  onboarding writes `users/{uid}` to Firestore; rules enforce owner-only.
- AI counselor confirmed in its safe **disabled** state (deterministic guardrails + template
  fallback; `ai_meta.fallback`).

## What was deferred (with reason)
- **Admin dashboard → Firebase cutover** — admin still reads Supabase; not on the student critical
  path; larger change. Documented as the top backlog item.
- **Dialogflow CX agent** — needs console agent creation; AI ships safely disabled.
- **Server-side PDF in Cloud Storage** — printable HTML works for launch.
- **Password reset flow** — post-release.
- **Human translation review, methodology validation, official university data, richer
  labor-market data, parent view, notifications, mobile app** — post-launch backlog.

See `DEPLOYMENT_FINAL.md`, `HANDOFF.md`, `PUBLIC_LAUNCH_CHECKLIST.md`, and `POST_LAUNCH_BACKLOG.md`.
