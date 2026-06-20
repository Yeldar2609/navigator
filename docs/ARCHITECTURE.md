# Architecture

> **Day-6 update.** The backend moved to **Firebase-first** (Auth + Firestore +
> Storage), with **Supabase kept as legacy/fallback**. The AI counselor was
> re-platformed to **Google Dialogflow CX** with a production-safe disabled
> state. Deploy target is **Firebase App Hosting or Cloud Run**. Sections changed
> for Day 6 are marked **[Day 6]**; the rest of Days 1–5 still holds.

## Stack
- **Next.js 14 (App Router)** + **TypeScript** (strict)
- **Tailwind CSS 3.4** with CSS-variable design tokens
- **Framer Motion** for restrained micro-interactions (respects `prefers-reduced-motion`)
- **[Day 6] Firebase** — Auth, Firestore, Cloud Storage (`firebase` web SDK +
  `firebase-admin`). **Supabase** (`@supabase/ssr`) is retained as the
  **legacy/fallback** backend, not the production default.
- **Zod** for validation; **Vitest** (unit) + **Playwright** (e2e)
- Hand-rolled shadcn-style UI primitives (CVA + `tailwind-merge`), no component CLI
- **[Day 6] Deploy target:** **Firebase App Hosting** (best fit for Next.js App
  Router SSR) **or Google Cloud Run** via the provided `Dockerfile`.

## Routing & i18n
- Locale-prefixed routes: `/kk`, `/ru`, `/en`. The root layout lives at
  `app/[lang]/layout.tsx` (sets `<html lang>`).
- `middleware.ts` redirects un-prefixed paths to the default locale (`ru`).
  API routes are excluded. (Day-1–5 Supabase session refresh in middleware
  remains for the legacy path.)
- Dictionaries: `lib/i18n/messages/{en,ru,kk}.ts`. `en` is canonical; `ru`/`kk`
  are typed as `Messages` so missing/extra keys fail `npm run typecheck`.
  Assessment item text lives in `lib/methodology/assessment-items.ts` (kept out
  of the UI dict).

## Folders
```
app/[lang]/      pages (landing, auth, onboarding, assessment, results, plan, chat, check-ins, admin)
app/api/         route handlers (health + version live; assessment/results/plan/check-ins/chat/admin)
components/      ui/ (primitives) · layout/ · marketing/ · motion/ · <domain>/ (client widgets)
lib/i18n/        locale config + dictionaries
lib/methodology/ items, clusters, routes, scoring-config, awareness-index, recommendation-rules,
                 scoring, recommendations, careers-data, majors-data, plan-templates, comparison, tag-labels
lib/data/        backend-agnostic data abstraction (profile, assessment, plan, check-in, chat, types, mode)
lib/firebase/    [Day 6] client.ts (browser SDK) · admin.ts (Admin SDK: ID-token verify + Firestore/Storage)
lib/ai/          [Day 6] dialogflow-client, counselor-system-policy, counselor-guardrails, context-builder,
                 snapshot, safety, moderation; legacy client/counselor/system-prompt fallback
lib/supabase/    [legacy] browser, server, middleware clients (graceful when env missing)
lib/env.ts       [Day 6] centralized, fail-closed env access
lib/validations/ zod schemas
lib/utils/       cn, format, constants, api helpers
supabase/        [legacy] migrations/ + seed.sql
firebase.json · .firebaserc · firestore.rules · firestore.indexes.json · storage.rules   [Day 6]
Dockerfile · .dockerignore · apphosting.yaml                                              [Day 6]
tests/           unit/ (vitest) + e2e/ (playwright)
docs/
```

## [Day 6] The `lib/data/*` abstraction (why backends are swappable)
The UI never talks to a backend directly — it calls `lib/data/*` (profile,
assessment, plan, check-in, chat). This indirection is the seam that lets the
backend change without touching call sites:

- The UI source of truth in preview is a localStorage **`demoStore`**
  (`lib/demo/store.ts`); recommendations and scoring run **client-side** via the
  pure `lib/methodology/*` engine.
- **Mode switch:** `isDemoMode()` (`lib/data/mode.ts`). Demo mode is DEV-only
  local auth + localStorage. It **fails closed in production**: a prod build only
  enters demo when explicitly opted in (`NEXT_PUBLIC_DEMO_MODE=on`), so a
  misconfigured prod never silently grants fake auth.
- When a real backend is configured, the data layer **mirrors** server-side
  behind the same functions — so the Firebase migration sits *behind* the
  abstraction.

## [Day 6] Firebase-first backend
- **Client** (`lib/firebase/client.ts`): browser SDK for Auth/Firestore/Storage.
  Returns `null` when unconfigured so the app degrades to the
  unauthenticated/preview tier instead of crashing.
- **Admin** (`lib/firebase/admin.ts`, server-only): **Firebase ID-token
  verification** (`getAuthedUser` / `verifyIdToken` — never trust a client uid),
  plus admin Firestore/Storage handles. Returns `null` when admin creds are
  absent (soft-fail in dev; prod fails closed at the call site).
- **Env** (`lib/env.ts`): centralized typed access. `assertProductionEnv()`
  **throws** in `APP_ENV=production` when a critical Firebase var is missing
  (fail-closed). Config helpers: `isFirebaseClientConfigured`,
  `isFirebaseAdminConfigured`, `isAiCounselorConfigured`.
- **Firestore model** (`firestore.rules`): each student reaches **only** their
  own tree under `users/{uid}` (assessmentSessions/Answers/Results, plans+items,
  checkIns, progressCalendar, chatThreads+messages, reports). Scored results and
  report metadata are **server-write-only**. Public read-only catalogs:
  `careerCatalog`, `majorCatalog`, `universityCatalog`, `courseCatalog`,
  `assessmentTemplates`, `assessmentItemBank`. Admin/analytics/org collections
  have **no client rule path** — they are reached only via the Admin SDK from
  authorized, role-checked server routes.
- **Storage** (`storage.rules`): private reports under `reports/{uid}/` —
  owner-read only, server (Admin SDK) write only.
- **Supabase** stays wired as the **legacy/fallback** path (`lib/supabase/*`,
  `lib/auth/session.ts`); the Day-1–5 Supabase data flow remains valid where that
  backend is configured.

## Scoring pipeline (pure, testable — unchanged)
```
answers: { Q1..Q40 -> 1..5 }
        │
        ▼
scoreAssessment()  (lib/methodology/scoring.ts)
        │
        ├─ block scores     → mean(block items) → 0..100
        ├─ cluster scores    → mean(CLUSTER_ITEMS) → 0..100   (normalized; tolerant of overlap/uneven counts)
        ├─ awareness (IPO v1)→ 6 criteria → raw 0..60 → pct 0..100 → level (low/medium/high)
        └─ recommendations   → primary/secondary cluster, primary route, strengths, growth areas
        ▼
ScoredResult  → buildStudentResultSnapshot() → persisted (server-write-only)
```
The engine is I/O-free, so it is fully unit-tested without a database. See
`docs/ASSESSMENT_ALGORITHM.md` and `docs/RECOMMENDATION_ENGINE.md`.

## [Day 6] AI counselor — Google Dialogflow CX (production-safe disabled state)
The browser **never** calls Google directly — only `/api/chat` (server) does.

- **Client:** `lib/ai/dialogflow-client.ts` — `detectIntentText()` calls the
  configured Dialogflow CX agent (auth via the Firebase Admin service-account
  credentials + `cloud-platform` scope). Returns `null` when unconfigured or on
  any error, and the route falls back.
- **Persona/policy:** `lib/ai/counselor-system-policy.ts` — single source of
  truth for tone, in/out-of-scope, "canonical data is the deterministic engine —
  never recompute or contradict the score", and safety (crisis → urge a trusted
  adult / 112; never therapy or diagnosis). The Dialogflow agent and the
  deterministic template fallback both follow it.
- **Guardrails:** `lib/ai/counselor-guardrails.ts` — `checkScope()` runs
  **before** any model call and deterministically redirects out-of-scope
  requests (coding, homework, medical, therapy, sensitive data) in en/ru/kk —
  independent of the model, even when the agent is unconfigured. Crisis/harm is
  handled separately by `lib/ai/safety.ts` / moderation (takes precedence).
- **Context:** `lib/ai/context-builder.ts` — builds the **minimal** student
  context (language, coarse age range, route, top clusters, qualities, growth
  areas, up to 3 recommended careers, plan/check-in summaries). Deliberately
  **excludes** raw answers, name, email, school code, and admin data;
  `toDialogflowParameters()` flattens it to session parameters.
- **Production-safe disabled state:** `isAiCounselorConfigured()` is true only
  when `ENABLE_AI_COUNSELOR=true` **and** a real `DIALOGFLOW_CX_*` agent is set.
  Otherwise `/api/chat` returns the deterministic template counselor /
  guardrail responses with `ai_meta.fallback = true` — **AI is never faked as
  real in production**. (`/api/version` reports `aiCounselor: enabled|disabled`.)
- Selection order in `/api/chat`: Dialogflow CX → (legacy) text LLM if configured
  → deterministic template fallback.

## [Day 6] Deploy targets & operational surface
- **Frontend/SSR:** Firebase **App Hosting** (`apphosting.yaml`) or **Cloud Run**
  (`Dockerfile`, `.dockerignore`). Backend routes run in the same Next.js server,
  protected by Firebase ID-token verification + server-side authorization.
- **Secrets:** Google Secret Manager in prod; `.env.local` for dev
  (`.env.example` documents the full set).
- **Ops endpoints:** `GET /api/health` (liveness) and `GET /api/version`
  (name/version/commit/env + backend `firebase|demo` + AI `enabled|disabled`).
- **Human-only blockers** (cannot be automated; see `DAY_6_EXECUTION_PLAN.md`):
  Firebase Web App config values, CLI/gcloud auth, creating the Dialogflow CX
  agent, the Admin service account, and bootstrapping the first admin.

## Data flow (Day-6 target)
```
Student → onboarding → assessment (save-answer) → submit → scoreAssessment → results
        → plan/generate (horizon 1/2/3/6) → plan items → check-ins → AI counselor (Dialogflow CX, when enabled)
   persistence: lib/data/* → demoStore (preview)  OR  Firebase (Auth + Firestore + Storage)
Admin   → org-scoped dashboard via Admin SDK behind authenticated, role-checked server routes
```
