# Day 6 Execution Plan — Kim Bolam Production Build

> Branch: `worktree-day-6-build` (off `day-6`) · Repo: `github.com/Yeldar2609/navigator` · 2026-06-19

## 1. Repo status (verified)
- Git repo on `main`; clean before this work. Working on a worktree branch off HEAD `6b6733a`.
- 3 commits through Day 5. Remote `origin` → GitHub.
- Tooling: `firebase` CLI 15.20.0 ✓, Node v22 ✓. `gcloud` **not on PATH** in the build shell
  (installed per project notes; must be added to PATH to deploy Cloud Run). `firebase` **not
  logged in** yet.

## 2. Current stack (Days 1–5 MVP)
- **Next.js 14 App Router · TypeScript · Tailwind · Framer Motion.**
- **Data abstraction already exists** at `lib/data/*` (profile, assessment, plan, check-in, chat,
  types, mode). UI source of truth is a localStorage **`demoStore`**; when Supabase env is present
  the data layer **mirrors** server-side. Central switch: `isDemoMode()` keyed on `isSupabaseConfigured()`.
- **Methodology engine** at `lib/methodology/*` (assessment-items, scoring, recommendations,
  careers-data, majors-data, plan-templates, clusters, routes) — substantial and tested.
- **AI scaffold** at `lib/ai/*` — currently OpenAI-shaped (`OPENAI_API_KEY`). Re-platform to
  Google Conversational Agents / Dialogflow CX.
- **Auth** via Supabase SSR (`lib/supabase/*`, `lib/auth/session.ts`).
- 47 routes build; 52 unit tests; 17 e2e green (Day 5 notes).

## 3. Not production-ready
- No Firebase (no `firebase.json`, rules, client/admin SDK). Target per Day 6 is Firebase-first.
- AI not wired to a real Google agent; OpenAI-style key.
- No deploy artifacts (`Dockerfile`, App Hosting config, `/api/health`, `/api/version`).
- `.env.example` lists Supabase + OpenAI only.
- Career catalog < 100; majors < 30; salary/demand provenance not formalized.

## 4. Replace vs. keep
- **Keep & extend:** `lib/data/*` abstraction, all of `lib/methodology/*`, i18n, components,
  demoStore (becomes the unauthenticated/preview tier).
- **Add behind the abstraction:** Firebase backend (Auth + Firestore + Storage) selected by a new
  backend mode so call sites don't change.
- **Isolate as legacy/fallback:** `lib/supabase/*` — kept, documented, not the production default.
- **Re-platform:** `lib/ai/*` → Dialogflow CX layout with a production-safe disabled state.

## 5. Execution order
1. Foundation — Firebase client/admin SDK, `lib/env.ts` (fail-closed in prod), rewrite `.env.example`,
   `firebase.json`/`.firebaserc`/`firestore.rules`/`storage.rules`/`firestore.indexes.json`.
2. Data layer — Firestore behind `lib/data/*`; server-side Firebase ID-token verification; Storage
   for private reports.
3. AI counselor — `lib/ai/dialogflow-client.ts`, `counselor-guardrails.ts`,
   `counselor-system-policy.ts`, `safety.ts`, `context-builder.ts`; `/api/chat`; disabled/fallback.
4. Deploy artifacts — `Dockerfile`, `.dockerignore`, `/api/health`, `/api/version`, App Hosting config.
5. Content/features — careers → 100+, majors → ~30 (provenance), adaptive assessment + retake wording,
   plan horizons/difficulty, check-ins, admin guards, PDF reports, landing, internal analytics.
6. Tests + docs — lint/typecheck/unit/build + critical new tests; all `/docs/*` Day-6 files.
7. Deploy — as far as automatable, then hand off human-only steps.

## 6. Deployment path
- **Frontend:** Firebase **App Hosting** (best fit for Next.js App Router; SSR over HTTPS) or
  Cloud Run via the provided `Dockerfile`.
- **Backend routes** run in the same Next.js server, protected by Firebase ID-token verification +
  server-side authorization.
- **Secrets:** Google Secret Manager in prod; `.env.local` for dev.
- **Project:** `kim-bolam` (887167045950), Blaze billing enabled.

## 7. Remaining blockers (human-only — cannot be automated)
Block the *deploy*, not the *build*. Full steps in `DEPLOYMENT.md` / `FIREBASE_SETUP.md`.
1. **Firebase web app + config** — create a Web App in the `kim-bolam` Firebase project for the
   `NEXT_PUBLIC_FIREBASE_*` values (console).
2. **CLI auth** — `firebase login`; `gcloud auth login` / PATH fix.
3. **Dialogflow CX agent** — none exists; `DIALOGFLOW_CX_LOCATION` / `_AGENT_ID` unknown. AI ships
   in a production-safe disabled state until created (never faked).
4. **Service account** — Firebase Admin creds (`FIREBASE_ADMIN_CLIENT_EMAIL`/`_PRIVATE_KEY`).
5. **First admin** — bootstrap a custom claim / roles doc (documented).

## 8. Decisions taken (safe defaults — see DECISIONS_AND_ASSUMPTIONS.md)
- Firebase backend behind the existing data abstraction (lowest-risk migration of a working app).
- `demoStore` stays as the unauthenticated landing/preview tier; sign-in required before persisting
  full results.
- AI ships disabled-but-wired when no agent is configured; `/api/chat` returns a clear,
  non-faked unavailable state.
- Production fails closed: missing critical env in `APP_ENV=production` is a hard error.
