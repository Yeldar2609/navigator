# Day 6 Notes — Production Build, Google/Firebase Migration, AI Counselor

Branch: `worktree-day-6-build` (off `day-6`). Goal: move from demo to a real, deployable public app —
Firebase-first backend, Google Dialogflow CX AI counselor, deploy artifacts, and an honest handoff for
the human-only deploy steps.

## What shipped this pass

### Foundation (Firebase + env + config)
- `lib/env.ts` — typed env access; **production fails closed** (`assertProductionEnv()`); config gates
  for Firebase client/admin and the AI counselor.
- `lib/firebase/client.ts` — browser SDK (Auth/Firestore/Storage), returns null until configured.
- `lib/firebase/admin.ts` — Admin SDK; `verifyIdToken`, `getAuthedUser(req)` (bearer-token → uid),
  `getAdminDb`, `getAdminBucket`.
- `lib/firebase/firestore.ts` — server-side Firestore data layer (profile, results, plans, check-ins,
  chat, internal analytics) keyed by the verified uid.
- `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`,
  `apphosting.yaml`, `Dockerfile`, `.dockerignore`. Rewrote `.env.example` to the full Firebase/
  Dialogflow/Cloud var set (placeholders only).
- `next.config.mjs` → `output: 'standalone'` for the Cloud Run path.

### AI counselor (Google Dialogflow CX)
- `lib/ai/dialogflow-client.ts` — server-only CX `detectIntent` client (google-auth-library token),
  20s timeout, returns null on any error/unconfigured.
- `lib/ai/counselor-guardrails.ts` — deterministic scope gate (refuses coding/homework/math/medical/
  therapy/sensitive-data) with localized ru/kk/en redirects; `PRIVACY_INPUT_HINT`.
- `lib/ai/counselor-system-policy.ts` — persona/policy (scope, tone, language) — source of truth.
- `lib/ai/context-builder.ts` — MINIMAL context → CX session parameters (no name/email/school/raw
  answers; coarse age bucket).
- `app/api/chat/route.ts` — runs safety + guardrails before any model call; **prefers Dialogflow CX
  when configured**, else text-LLM, else the deterministic template counselor; returns `ai_meta`
  (provider/fallback/language). **Never fakes AI as real** — disabled-but-wired by default.

### Security & privacy
- Firestore rules: students reach only `/users/{uid}`; catalogs public-read; everything else server-only.
  **No client path exposes another user's chats, results, or reports.** Storage: `reports/{uid}/`
  owner-read, server-write only.
- Admin authorization via Firebase custom claim, server-side only; admins never get client chat access.

### Tests
- `tests/unit/counselor-guardrails.test.ts` (4) and `tests/unit/env.test.ts` (5) — both green.
- Typecheck + lint clean. (Full suite re-run before commit; see below.)

### Docs (this pass)
`DAY_6_EXECUTION_PLAN`, `DECISIONS_AND_ASSUMPTIONS`, `FIREBASE_SETUP`, `GOOGLE_CLOUD_SETUP`,
`CONVERSATIONAL_AGENT_SETUP`, `SECRETS_SETUP`, `DATA_SOURCES`, `SECURITY_AND_PRIVACY`, `DEPLOYMENT`,
`PDF_REPORTS`, `ASSESSMENT_ALGORITHM`, `RECOMMENDATION_ENGINE`, updated `ARCHITECTURE` +
`KNOWN_LIMITATIONS`, this file.

### Content
- Career & major catalogs expanded toward the 100+ / ~30 targets (preserving existing entries; tests
  kept green). See `careers-majors.test.ts` for the asserted minimums.

## Human-only blockers before deploy (cannot be automated)
1. Firebase **Web App** config (`NEXT_PUBLIC_FIREBASE_*`) — console.
2. Firebase **Admin** service-account key (`FIREBASE_ADMIN_*`).
3. `firebase login`; `gcloud auth login` + `gcloud` on PATH.
4. (AI) Dialogflow CX **agent** (`DIALOGFLOW_CX_LOCATION` / `_AGENT_ID`).
5. First-admin custom claim bootstrap.
See `DEPLOYMENT.md` for the exact commands.

## Post-deploy verification checklist
- `GET /api/health` ok · `GET /api/version` shows env/backend/aiCounselor.
- `/ru` (default), `/kk`, `/en` load. Sign-up → onboarding → assessment (age slider, 1–5 scale) →
  results (0–100 + internal 0–60 in detail) → plan generate → plan item complete → weekly/monthly
  check-in (non-confetti celebration).
- AI counselor: student-initiated only; refuses out-of-scope; answers (agent set) or template fallback
  (agent unset) — never a fake AI claim; privacy hint visible.
- Report PDF downloads (private; excludes chat + raw answers).
- Admin dashboard protected; export CSV/PDF works; delete history audited; admins cannot see chats.

## Commands run
`npm install firebase firebase-admin` · `npm run typecheck` · `npm run lint` ·
`npx vitest run <new tests>` · (full `npm run test` + `NEXT_PUBLIC_DEMO_MODE=on npm run build` before commit).
