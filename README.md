# Navigator

A calm, teen-friendly career self-determination companion for students in Kazakhstan
(grades 8–11). Understand yourself → explore directions → get recommendations → follow a
month-by-month plan. Kazakh / Russian / English.

## Quick start (zero-setup demo)
```bash
npm install
npm run dev   # http://localhost:3000  (redirects to /ru)
```
Sign up (demo mode — no real email needed) → onboarding → assessment → results → one-month plan.
Everything runs locally; no environment variables required.

## Scripts
- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` · `npm run typecheck`
- `npm run test` (Vitest unit) · `npm run test:e2e` (Playwright — run `npm run build` first)

## Real deployment (Supabase)
Copy `.env.example` → `.env.local` and fill the Supabase keys (this **disables demo mode**), then
apply `supabase/migrations/*.sql` and `supabase/seed.sql`. Deploy target: Google Cloud Run.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind 3.4 · Framer Motion · @supabase/ssr · Zod ·
Vitest · Playwright.

## Docs
- `docs/ARCHITECTURE.md` — stack, folders, scoring pipeline
- `docs/DAY_1_NOTES.md` / `docs/DAY_2_NOTES.md` — what was built each day + how to run
- `docs/METHODOLOGY_ASSUMPTIONS.md` — scoring is a documented productization, not a clinical key

> Note: the project currently lives under OneDrive; `node_modules`/`.next` are git-ignored. If
> installs/builds act up, pause OneDrive sync or move the folder out (see DAY_1_NOTES).
