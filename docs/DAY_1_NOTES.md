# Day 1 Notes

## What was built (foundation for the Day 2 end-to-end demo)
- Next.js 14 App Router + TypeScript + Tailwind scaffold (manual, no `create-next-app`).
- **i18n** for `kk` / `ru` / `en` with locale-prefixed routing + middleware redirect.
- **Polished landing page**: hero with gradient + floating cards, value cards,
  emotional reassurance section, "how it works", language switcher, sign in/up.
- **Design system**: CSS-variable tokens, UI primitives (button, card, badge, progress,
  input, textarea, select, label, route-badge, empty/loading/error states), and motion
  components (MotionCard, AnimatedProgressBar, PulseSavedIndicator, CelebrateCheckmark,
  SoftPageTransition) — all honoring `prefers-reduced-motion`.
- **Auth shell** (email/password) that degrades gracefully without Supabase keys.
- **App pages** with real, interactive placeholders: onboarding form, an interactive
  **assessment preview** (instant selection feedback + "saved" pulse + progress),
  results/plan empty states, a horizon picker, a check-in preview, chat shell, admin shell.
- **Methodology engine** (pure, tested): 40 items, PROPOSED cluster mapping, awareness
  index (raw 0–60 + 0–100 + levels), recommendations, full `scoreAssessment()`.
- **API**: live `/api/health`; typed, validated Day-2 stubs for the rest.
- **Database**: full migration (`supabase/migrations/0001_init.sql`) with RLS + seed
  (`supabase/seed.sql`): template v1, 40 questions, demo org `DEMO-SCHOOL`, 25 careers,
  15 majors.
- **Tests**: Vitest units (locales, item count/shape, cluster validity, awareness
  thresholds, scoring) + Playwright smoke (3 locales load, language switcher, sign-in).

## Run locally
```bash
cd navigator
npm install
npm run dev          # http://localhost:3000  → redirects to /ru
npm run lint
npm run typecheck
npm run test         # vitest unit tests
npm run build        # production build
npm run test:e2e     # playwright smoke — serves the production build (run build first;
                     # installs a browser on first run)
```
> The app runs fully in **preview mode without any environment variables** — auth and
> DB features show a friendly setup notice instead of failing.

## Env setup
Copy `.env.example` → `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_APP_URL`, `DEFAULT_LOCALE` (default `ru`)
- `OPENAI_API_KEY` (placeholder; not used on Day 1)

## Supabase setup
1. Create a Supabase project; copy the API keys into `.env.local`.
2. Apply schema: run `supabase/migrations/0001_init.sql` (CLI `supabase db reset`, or
   paste into the SQL editor).
3. Seed: run `supabase/seed.sql` (idempotent).
4. Demo user: create via Dashboard → Authentication (passwords are hashed by GoTrue and
   can't be seeded from SQL). See the comment block at the end of `seed.sql`.

## Known assumptions
See **docs/METHODOLOGY_ASSUMPTIONS.md**. Headlines: cluster mapping is `PROPOSED_MAPPING_V1`;
awareness 0–60 uses a configurable rescale (exact thesis sub-scale = TODO); careers/majors
are curated demo data; no parental consent yet; AI counselor is later and is not clinical care.

## Environment caveat (this machine)
The project lives under **OneDrive** (`Desktop\navigator`). OneDrive may try to sync
`node_modules` / `.next` and occasionally lock files (slow installs, intermittent
`EPERM`/`EBUSY`). Both are git-ignored. If a build or install acts up, pause OneDrive
sync (or exclude this folder), or move the project outside OneDrive.

## Blockers / questions for Day 2
1. **Thesis specifics** — exact 40-item wording, the validated cluster key, and the true
   awareness-index formula. Until provided, defaults stand (documented).
2. **Auth → profile** — wire `signUp`/`signIn` to create the `profiles` row on onboarding.
3. **Assessment persistence** — `start` → `save-answer` (upsert) → `submit`
   (run `scoreAssessment`, write `assessment_results`).
4. **Plan generation** — turn a result + horizon into `plan_items`.
5. **Admin RLS** — org-scoped reads via a `SECURITY DEFINER` helper (deferred on Day 1).
6. **AI counselor** — provider choice + moderation before enabling chat.
