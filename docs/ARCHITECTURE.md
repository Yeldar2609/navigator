# Architecture

## Stack
- **Next.js 14 (App Router)** + **TypeScript** (strict)
- **Tailwind CSS 3.4** with CSS-variable design tokens
- **Framer Motion** for restrained micro-interactions (respects `prefers-reduced-motion`)
- **Supabase** (Auth, Postgres, Storage) via `@supabase/ssr`
- **Zod** for validation; **Vitest** (unit) + **Playwright** (e2e)
- Hand-rolled shadcn-style UI primitives (CVA + `tailwind-merge`), no component CLI
- Deploy target (later): **Google Cloud Run**

## Routing & i18n
- Locale-prefixed routes: `/kk`, `/ru`, `/en`. The root layout lives at
  `app/[lang]/layout.tsx` (sets `<html lang>`).
- `middleware.ts` redirects un-prefixed paths to the default locale (`ru`) and
  refreshes the Supabase session on localized routes. API routes are excluded.
- Dictionaries: `lib/i18n/messages/{en,ru,kk}.ts`. `en` is canonical; `ru`/`kk` are
  typed as `Messages` so missing/extra keys fail `npm run typecheck`. Assessment item
  text lives in `lib/methodology/assessment-items.ts` (kept out of the UI dict).

## Folders
```
app/[lang]/      pages (landing, auth, onboarding, assessment, results, plan, chat, check-ins, admin)
app/api/         route handlers (health is live; the rest are typed Day-2 stubs)
components/      ui/ (primitives) · layout/ · marketing/ · motion/ · <domain>/ (client widgets)
lib/i18n/        locale config + dictionaries
lib/methodology/ items, clusters, routes, scoring-config, awareness-index, recommendation-rules, scoring
lib/validations/ zod schemas
lib/supabase/    browser, server, middleware clients (graceful when env missing)
lib/utils/       cn, format, constants, api helpers
supabase/        migrations/ + seed.sql
tests/           unit/ (vitest) + e2e/ (playwright)
docs/
```

## Scoring pipeline (pure, testable)
```
answers: { Q1..Q40 -> 1..5 }
        │
        ▼
scoreAssessment()  (lib/methodology/scoring.ts)
        │
        ├─ block scores      → mean(block items) → 0..100
        ├─ cluster scores     → mean(CLUSTER_ITEMS) → 0..100   (normalized; tolerant of overlap/uneven counts)
        ├─ awareness (IPO)    → rescale total → raw 0..60 → pct 0..100 → level (low/medium/high)
        └─ recommendations    → primary/secondary cluster, primary route, strengths, growth areas
        ▼
ScoredResult  → persisted to assessment_results (Day 2)
```
The engine is I/O-free, so it is fully unit-tested without a database.

## Supabase clients
- `browser.ts` / `server.ts` / `middleware.ts` each guard missing env. The UI checks
  `isSupabaseConfigured()` and renders a setup notice instead of crashing — the whole
  app is usable in **preview mode** with no keys.

## Data flow (Day 2 target)
```
Student → onboarding → assessment (save-answer) → submit → scoreAssessment → results
        → plan/generate (horizon 1/2/3/6) → plan_items → check-ins → AI counselor (later)
Admin   → org-scoped dashboard (RLS via SECURITY DEFINER helper — deferred)
```
