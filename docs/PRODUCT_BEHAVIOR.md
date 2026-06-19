# Navigator — Product Behavior

How the app is meant to behave, page by page, plus the non-negotiable rules that
every change must preserve. This is the contract; the code implements it.

## Non-negotiables (do not regress)

1. **Deterministic scoring is the single source of truth.** `lib/methodology/scoring.ts`
   (`scoreAssessment`) computes the canonical result. It is pure, versioned
   (`navigator_methodology_v1`), and reproducible. **AI never decides the score** — the
   AI counselor (later) only explains and discusses what the engine already produced.
2. **Demo mode is DEV-only and never exposes secrets.** With Supabase unconfigured the
   app runs fully client-side on a localStorage store (`lib/demo/store.ts`). It is
   **fail-closed in production**: demo only activates when Supabase is unconfigured AND
   (dev OR `NEXT_PUBLIC_DEMO_MODE=on`). No service-role key, token, or secret is ever in
   the browser bundle or the demo store.
3. **No invented labor-market data.** `marketRelevance` and the explorer’s market signal
   are labelled **curated demo relevance**, not live statistics. Real KZ labor-market and
   university-program data are a documented TODO (see `careers-data.ts`, `majors-data.ts`).
4. **No hidden assumptions.** Every productization gap (awareness derivation, cluster
   mapping, majors linking rule) uses a configurable/transparent default and is documented
   in `docs/METHODOLOGY_ASSUMPTIONS.md`. When a gap would change results materially, STOP
   and ask rather than guess.
5. **Tone: calm, modern, for teenagers (grades 8–11).** Reduce fear and confusion. No
   childish styling, no shaming language. Low scores are framed as a starting point.
6. **Tri-lingual parity (kk / ru / en).** Dictionaries are typed `Messages = typeof en`;
   ru/kk are typed `: Messages`, so any missing key fails `tsc`. Every user-facing string
   goes through the dictionary.
7. **Accessibility + reduced motion.** Interactive controls expose state
   (`aria-pressed`/`aria-current`); all animation honors `prefers-reduced-motion`.

## The methodology (canonical pipeline)

40 Likert items (1–5) across 4 blocks (interests, competencies, values, strengths) →
normalized 0–100 **block** and **cluster** scores → **Career Readiness** (6 criteria:
knowing yourself, knowing your skills, career knowledge, independence, confidence, having
a plan; 0–60 raw → 0–100 pct → low/medium/high) → **primary + secondary cluster** →
**route** (technological / research / managerial / social-humanitarian / creative) with
tie-breaks → **recommendations** (bucketed: recommended / exploratory / stretch, each with
a confidence level). Generating a plan re-scores with `planGenerated: true` so readiness
rises once a plan exists — but route and recommendations are deterministic for the same
answers, so they never drift.

## Pages

- **Landing (`/[lang]`)** — marketing shell (unauthenticated). Language switch, sign-in/up.
- **Onboarding (`/onboarding`)** — name, grade, subjects, goals, confidence, support
  preference. Feeds onboarding context into scoring + recommendations. No parental-consent
  flow in MVP.
- **Assessment (`/assessment`)** — 4 sections × 10 items. **Resumes** at the first
  unanswered question (or the review screen if complete). A **section map** shows
  per-section progress and lets the student jump between sections. A final **review
  screen** lists every answer with inline **Change**; submit is blocked until all 40 are
  answered. Answers persist per item as they’re chosen.
- **Results (`/results`)** — readiness ring + 6-criterion breakdown with a shame-free
  explanation, direction (route), clusters, strengths, growth areas, and careers grouped
  into recommended / exploratory / stretch (confidence chip + match %). “Build my plan”.
- **Plan (`/plan`)** — multi-horizon (1 / 2 / 3 / 6 months). Horizon selector, progress
  ring, “this week” step, monthly tabs, weekly actions with category labels, reflection +
  success metric, completion milestone. **Switching horizon preserves completed progress**
  (month 1 is identical across horizons — a prefix chain — so checked items carry over).
- **Career Explorer (`/career-explorer`)** — browse/filter/search all 40 careers; the
  detail panel shows subjects to focus on, skills to build, why it might fit, and **related
  majors** (linked by route + subject affinity from the 25-major set).
- **Dashboard (`/dashboard`)** — “Your path today”: greeting, a confidence boost, the
  readiness ring + direction, today’s plan step (or a build-plan prompt), the strongest
  career match, quick links, and a check-in nudge. First-timers are routed to the
  assessment. This is the calm home that stitches the other surfaces together.
- **Check-ins (`/check-ins`)** — mood / confidence / effort (1–5) + optional note; saves to
  history with an after-save reward. History persists locally (and to `check_ins` when
  configured, RLS-scoped to the student).
- **Chat (`/chat`)** — AI counselor placeholder (Day 4+). Will explain results, never
  override the score.

## Persistence model

- **Demo (no Supabase):** localStorage store is the UI source of truth; the same
  deterministic engine runs client-side.
- **Configured (Supabase):** the client mirrors locally for instant UX and fires
  **server-authoritative** API routes. The server resolves the student from the authed
  session — it never trusts client-supplied ids/ownership — checks every query, and relies
  on RLS so a student only ever reads/writes their own rows.

## Mobile

The authenticated shell shows a fixed **bottom tab bar** on small screens (dashboard,
results, plan, careers, check-ins); desktop uses the header nav. Content is padded so it
clears the bar.

## Known follow-ups (Day 4+)

- Real KZ labor-market + university-program data (replace curated demo relevance + majors).
- AI counselor wiring (explain-only; never decides the score).
- Server-side plan-item id threading so configured-mode progress updates match by id
  (demo path is unaffected; today the update route fails-soft and reports `not_found` on a
  0-row update).
- Real thesis instrument (exact item wording, validated cluster key, true awareness
  formula) — everything is a documented productization until provided.
