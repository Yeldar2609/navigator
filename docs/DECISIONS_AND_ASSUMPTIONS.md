# Decisions & Assumptions — Day 6

Safe, production-ready defaults taken where the spec left non-blocking choices. Blockers are listed
separately at the end.

## Architecture
- **Firebase backend added behind the existing `lib/data/*` abstraction** rather than rewriting every
  call site. The Days 1–5 app already routes data access through an abstraction with a demo
  (localStorage) tier and optional server mirroring. Adding Firebase here is the lowest-risk way to
  migrate a *working* app. Supabase is retained as documented legacy/fallback, not the default.
- **`demoStore` stays as the unauthenticated landing/preview tier.** Students can begin the experience
  before sign-in; full results require sign-in to persist (matches the landing-flow spec).
- **Auth model:** Firebase Auth; server routes verify the Firebase ID token
  (`lib/firebase/admin.ts → getAuthedUser`). Client-supplied user IDs are never trusted.
- **Admin credentials via ADC, not a key file.** The org enforces
  `iam.disableServiceAccountKeyCreation` (downloadable keys blocked), so `lib/firebase/admin.ts` uses
  `applicationDefault()` — the runtime service account in production, `gcloud auth application-default
  login` locally. An explicit key is still honored if the policy is ever lifted. This is also Google's
  recommended posture (no long-lived key to leak).

## AI counselor
- **Disabled-but-wired by default.** No Dialogflow CX agent exists yet, so the counselor uses the
  deterministic template fallback with `ai_meta.fallback = true`. We never present the fallback as a
  real AI agent. Guardrails + safety still run.
- **Guardrails enforced in-app** (`counselor-guardrails.ts`) *before* any model call — defense in
  depth even if the agent is misconfigured.
- **Minimal context only** is sent (no name/email/school/raw answers; coarse age bucket, never exact).

## Data model
- Per-user data under `users/{uid}/...` subcollections (clean ownership → simple, strict rules).
  Public curated catalogs are top-level read-only. Sensitive collections (analytics, audit, admin) are
  server-only via the Admin SDK.
- **Admins operate only through server routes**; there is no client rule path to another user's data,
  which is how "admins cannot see chats" is guaranteed structurally.

## Scoring & display
- Student-facing score is **0–100**; the internal **0–60** methodology score is preserved and shown in
  report detail. Encouraging labels only ("Still exploring" → "Strong clarity"); no low/bad/weak.
- Retake interval default **2 months**; retakes use alternative wording (documented extension point in
  `ASSESSMENT_ALGORITHM.md`).

## Salary / labor-market data
- Shown as clearly-labeled **curated estimates** with provenance fields until verified against official
  KZ sources (Enbek / Bureau of National Statistics). The AI never invents salary data. See
  `DATA_SOURCES.md`.

## Deploy
- **Firebase App Hosting** chosen as the primary path (best Next.js App-Router fit); Cloud Run via the
  included `Dockerfile` is the documented alternative. Min instances 0; HTTPS via Google; secrets via
  Secret Manager.
- **No Firebase Analytics** — internal Firestore analytics is faster/cheaper and sufficient. Sentry
  skipped per spec; AI failures are logged server-side and the user can report an issue.

## Assumptions
- `GOOGLE_CLOUD_REGION` defaults to `us-central1` (change before first deploy if a KZ-closer region is
  preferred — Firestore location is permanent).
- The "export chat" analytics item is interpreted as **report export / a chat-sent event** — chat
  content is never exportable.

## Setup status (live — updated 2026-06-19)
1. Firebase **Web App** config (`NEXT_PUBLIC_FIREBASE_*`) — ✅ DONE (app created; values in `.env.local`).
2. Firebase added to the `kim-bolam` GCP project — ✅ DONE.
3. CLI auth (`firebase`, `gcloud` as `yeldar@american-study.com`) — ✅ DONE.
4. Required APIs (identitytoolkit, firestore, firebasestorage, run, cloudbuild, secretmanager) — ✅ enabled.
5. Firebase **Admin** credentials — **ADC** (org blocks key files): auto in prod; `gcloud auth
   application-default login` locally. No key needed.
6. **Email/Password** sign-in — ⏳ needs the one-time Firebase Auth "Get started" provisioning (console),
   then it's a single toggle.
7. **Firestore DB + Storage bucket** — ⏳ pending region choice (permanent), then created + rules deployed.
8. (AI) Dialogflow CX **agent** — not created; counselor stays safely disabled.
9. First-admin custom claim — bootstrap after the first sign-up.
