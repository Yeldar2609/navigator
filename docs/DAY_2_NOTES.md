# Day 2 Notes

## What shipped — a working end-to-end demo
sign in (demo) → onboarding → assessment → submit → results → recommendations → 1-month plan.
Runs locally with **zero setup** (demo mode), and feels polished enough to show someone.

- **Auth (demo)** — `lib/auth/session.ts`. Demo mode creates a local DEV-only account; with
  Supabase env it's real email/password. Friendly copy, loading states, smooth redirect to onboarding.
- **Onboarding wizard** — `components/onboarding/onboarding-wizard.tsx`. 4 animated steps
  (basics, favorite subjects, goals, confidence & support + free text), progress bar, animated
  chips, celebration → CTA to the assessment. Saves the profile (local store; Supabase upsert when configured).
- **Assessment flow** — `components/assessment/assessment-flow.tsx`. 4 sections × 10 questions,
  one at a time, section intros + per-section encouragement, autosave + "Saved" pulse, animated
  progress, Back/Continue, "Building your profile…" transition. Student-friendly 1–5 labels in all 3 languages.
- **Deterministic scoring v1** — `lib/methodology/*`. IPO v1 (6 criteria), route resolution with
  tie-breaks, normalized cluster/block scores, weighted career recommendations (top 5). See METHODOLOGY_ASSUMPTIONS.
- **Results** — `components/results/results-view.tsx`. Hero, animated Career Readiness ring,
  staggered cards (your direction, top clusters, strengths, areas to grow, top-5 careers with
  why/skills/first-step, "what this means"), non-deterministic copy, CTAs (build plan, ask counselor).
- **One-month plan** — `components/plan/plan-view.tsx`. Route-based 4-week plan (Explore/Learn/
  Try/Reflect), checklist with mark-done, progress bar, completion celebration → check-in CTA.
  Generating a plan raises the readiness score (professional_plan 4 → 8).
- **Chat shell** — assistant intro + suggested prompt chips + disabled composer ("connected in
  the next build"). No fake AI answers.
- **APIs** — `app/api/...`. `start` is real (no DB). `save-answer` / `submit` / `plan/generate` /
  `results/latest` implement the Supabase path with a graceful demo fallback; all Zod-validated.
- **Migration 0002** — onboarding profile columns.

## Run the demo
```bash
cd navigator
npm install
npm run dev        # http://localhost:3000 → /ru ; pick a language, Sign up → onboarding → …
```
No environment variables needed. Everything persists in your browser (localStorage).

## Demo mode
Active by default in **development** when Supabase env is missing (zero-setup `npm run dev`).
**Fail-closed in production:** a production build with no Supabase env does NOT silently enable
demo auth (that would grant fake sessions). It must be explicitly opted in at build time with
`NEXT_PUBLIC_DEMO_MODE=on` (NEXT_PUBLIC_* vars are build-time inlined). So a real deploy that
forgot the Supabase env shows the setup notice instead of fake auth.
- Production demo / e2e build: `NEXT_PUBLIC_DEMO_MODE=on npm run build`
- Disable entirely: `NEXT_PUBLIC_DEMO_MODE=off`
- Reset demo data: clear the localStorage key `navigator_demo_v1`

## Post-build adversarial verification (16-agent workflow)
A read-only verification pass (find → refute → confirm, 6 dimensions) ran against Days 1–2 and
its confirmed findings were fixed:
- **Security (HIGH):** demo mode is now fail-closed in production (`lib/data/mode.ts`); the
  `__navTestFill` e2e hook is therefore only present in an explicit demo build, never a real deploy.
- **Assessment double-tap (HIGH):** `pick()` now guards with an in-flight ref so a fast double-tap
  can't skip a question or overshoot the array (was a `TypeError`/blank screen on touch).
- **Supabase persistence (CRITICAL):** the assessment/plan routes are now **server-authoritative**
  — they resolve the session/result from the authenticated profile (ignoring client-minted ids),
  scope question lookups to the active template, check every query error, and guard completeness
  before scoring. This makes the Supabase path actually functional (it was previously a no-op).
- **i18n / a11y / robustness:** added the missing `languages` skill label; gave the confidence
  slider + answer buttons accessible names and focus rings; made the 5-answer grid legible on
  phones; reduced-motion on the saved pill; aria on the score ring; storage-failure now surfaces
  in onboarding instead of silently "succeeding."

## Tests
- Unit (Vitest): scoring determinism, IPO v1 criteria, route tie-breaks, recommendation sort,
  awareness levels, 40-item invariants.
- E2E (Playwright): the full journey (onboarding → assessment via a demo test hook → results →
  plan), plus the Day-1 smoke suite. Runs against the production server.

## Blockers / questions
- Same thesis-specifics request as Day 1 (exact item wording, validated cluster key, real awareness
  formula). IPO v1 is a documented productization until those arrive.
- The Supabase-backed APIs are implemented but not exercised today (no Supabase env); the verified
  path is the client demo. Configure Supabase + run the migrations to exercise the server path.
- Plan horizons 2 / 3 / 6 months are intentionally Day-3 work — only the 1-month plan is built (per spec).
