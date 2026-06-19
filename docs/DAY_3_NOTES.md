# Day 3 Notes

Day 3 ("demo slice → real MVP core") is a large, multi-deliverable spec. This pass landed a
verified, coherent **methodology + explainable-results slice** and kept the app green. The
UI-heavy deliverables are clearly scoped below as the continuation.

## Shipped this pass (verified: typecheck + lint + 37 unit tests + build + 7 e2e)

### Methodology, strengthened (deliverable 2)
`lib/methodology/*` now exposes the named pure functions the spec asked for, all unit-tested:
- `calculateBlockScores(answers)`, `calculateClusterScores(answers)` — `scoring.ts`
- `resolvePrimaryAndSecondaryCluster(clusterScores)`, `resolveRoute(primary, secondary, scores)` — `recommendation-rules.ts`
- `calculateAwarenessIndex(inputs)` — `awareness-index.ts` (Day-2 `computeIpoV1` kept as a deprecated alias)
- `buildStrengths(...)`, `buildGrowthAreas(...)` — `recommendation-rules.ts`
- `buildStudentResultSnapshot(result)` — `scoring.ts` (stable serialization with
  `methodology_version` + `scoring_version` + `template_version`)
- New `METHODOLOGY_VERSION = navigator_methodology_v1` (scoring stays the canonical source of
  truth; AI never decides the score).

### Career Readiness criteria, renamed to student concepts (deliverable 3)
The 6 IPO criteria are now `self_understanding`, `skills_awareness`, `career_information`,
`independence`, `confidence`, `planning`. Results page shows the **main score ring + a
breakdown bar per criterion + a plain-language, shame-free explanation** for low/medium/high.

### Recommendation engine v2 (deliverable 6)
`recommendations.ts` rewritten. New weights (route 35 / primary cluster 20 / secondary 10 /
subjects 10 / goals 10 / market 10 / grade feasibility 5). Each career is tagged into a
**bucket** — `recommended` (best fit, on-route), `exploratory` (adjacent cluster, off-route),
`stretch` (high interest, route mismatch) — and carries a `confidenceLevel` (low/medium/high).
Results page renders the three buckets with confidence chips, why-it-fits reasons, "learn next"
skills, and a "this week" first action.

### Career Explorer (deliverable 4)
`/[lang]/career-explorer` — browse/filter/search over the career set with a detail panel
(`components/careers/career-explorer.tsx`). Market relevance is labelled **curated demo
relevance** with a TODO to integrate real KZ labor-market sources (no invented salaries/stats).
Added to the nav as `nav.careers`.

### Multi-horizon plan builder (deliverable 7)
`lib/methodology/plan-templates.ts` v2 generates **1 / 2 / 3 / 6-month** plans from a prefix
chain of archetypes (`HORIZON_SEQUENCE`), each month carrying theme/goal/4 weekly actions/
reflection/success-metric, localized en/ru/kk with `{route}`/`{topic}` interpolation. The plan
page (`components/plan/plan-view.tsx`) has a horizon selector, progress ring, "this week" card,
monthly tabs, per-week category labels, reflection/metric, and a completion celebration. Plan
generation re-scores with `planGenerated:true` (readiness rises once a plan exists) but the
**deterministic score stays canonical** — AI never decides it.

**Adversarial verification (read-only workflow, 8 agents) + fixes:**
- **HIGH (data loss), fixed:** switching the horizon rebuilt every item as `todo`, silently
  wiping checked-off progress. Because `HORIZON_SEQUENCE` is a prefix chain (month 1 is identical
  across horizons), `generatePlan` now carries over each prior item's id + status by
  `(monthIndex, weekIndex, category, title)`. Locked in by `tests/e2e/plan-horizon.spec.ts`
  (mark 1 of 4 done → switch to 3 months → asserts `1 of 12 done`, not `0 of 12`).
- **Fixed:** `justWon` timer now uses a ref + unmount cleanup (no stacked timers / setState-after-
  unmount); `result` state refreshed after generate (no stale route on the next horizon change);
  `/api/plan/update` now `.select()`s so a 0-row update returns `not_found` instead of a silent ok.
- **Documented, deferred to Day 4 (untested Supabase path only; demo path unaffected):** the
  server mints `plan_items` UUIDs the client never learns, so server-side progress updates can't
  match by id — needs id threading (same class as the Day-2 session-id fix). The re-score-on-
  generate recomputes route/recs, but they're deterministic for the same answers, so no divergence.

### Dashboard (deliverable 5)
`/[lang]/dashboard` — "Your path today": greeting + a `ConfidenceBoost`, the readiness ring +
direction, today's plan step (or a build-plan prompt), strongest career match, quick links, and a
check-in nudge. First-timers are routed to (or resume) the assessment. Loads behind a skeleton.
e2e: `dashboard.spec.ts`.

### Check-in persistence (deliverable 8)
Real local store (`StoredCheckIn` + `demoStore.get/addCheckIn`), data layer `lib/data/check-in.ts`,
and the two API routes implemented server-authoritatively (`/api/check-ins/{create,history}`;
create links the student's own latest plan, never a client-supplied id; RLS-scoped). New
`CheckInView` = form (mood/confidence/effort + optional note) → persist → after-save reward +
history list. e2e: `check-in.spec.ts` (saves survive reload).

### Assessment resume + review (deliverable 9)
`assessment-flow.tsx` now **resumes** at the first unanswered question (or the review screen if
complete), shows a tappable **section map**, and ends on a **review screen** with inline per-answer
**Change** (submit blocked until all 40 answered). e2e: `assessment-resume.spec.ts` (resume + review→submit).

### Emotional components + mobile nav shell (deliverable 10)
New `Skeleton`, `ConfidenceBoost`, `SmallWin`, `Milestone` (reused across dashboard + plan, no new
strings) and a fixed **mobile bottom-nav** (`BottomNav`) wired into `AppShell` (desktop keeps the
header nav). e2e: `mobile-nav.spec.ts`.

### Seed expansion (deliverable 1)
**40 careers (8 per route)** + **25 majors** (`lib/methodology/majors-data.ts`, tri-lingual). Careers
link to majors by **route + subject affinity** (`relatedMajorsFor`) — a transparent rule rather than
40 hand-authored lists — surfaced in the explorer detail ("Majors that lead here"). Still labelled
**curated demo relevance**; real KZ program/labor data remains a TODO. Per-career `starter_actions`
are intentionally not duplicated — concrete next actions already come from the plan's weekly actions
and the results "this week" step. Tests: `careers-majors.test.ts` (40/8-per-route, 25 majors,
referential integrity) + `career-explorer.spec.ts`.

### Docs (deliverable 11)
`docs/PRODUCT_BEHAVIOR.md` — the page-by-page behavior contract + the non-negotiables.

## Verification (whole Day-3 pass)
`typecheck` + `lint` (0 warnings) + **41 unit tests** + production build + **13 e2e** all green.
(Playwright per-test timeout raised 30s→60s: the full-journey specs legitimately run ~25–34s against
the production server on OneDrive I/O and were flaking right at the old limit, not regressing.)

## Deferred to Day 4
- Real KZ labor-market + university-program data (replace curated demo relevance + majors).
- Server-side `plan_items` id threading for configured-mode progress (demo path unaffected; the
  update route already fails-soft with `not_found` on a 0-row update).
- AI counselor wiring (explain-only; never decides the score).

## Run
Same as Day 2: `npm run dev` (zero setup, demo mode). Production demo / e2e build needs
`NEXT_PUBLIC_DEMO_MODE=on npm run build` (demo is fail-closed in production).

## Blockers / questions
- Unchanged from Days 1–2: the real thesis instrument (exact item wording, validated cluster key,
  true awareness formula). Everything is a documented productization until provided.
