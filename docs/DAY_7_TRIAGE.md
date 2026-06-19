# Day 7 Triage — Public Release Stabilization

> Branch `worktree-day-6-build` · latest `c655577` · 2026-06-19

## Verified baseline (entering Day 7)
- `typecheck` clean · `lint` (passes in a normal checkout; the worktree-nesting ESLint plugin
  conflict is environmental) · **62 unit tests green** · production build green.
- **Auth + persistence WORK live** (Day-6 cutover, verified against `kim-bolam`): Firebase
  email/password + Google sign-in; onboarding writes `users/{uid}` to Firestore (europe-west1);
  rules enforce owner-only. AI counselor ships in its safe disabled state (no Dialogflow agent).

## Release blockers (must fix for a public app)
1. **App is not deployed.** No production URL yet. → Deploy to Cloud Run (europe-west1) this pass.
2. **`/ru` is the public default and must be polished** (landing copy, one clear CTA).
3. **`robots` noindex** until the team is ready for indexing.

## Public-launch blockers (should fix before sharing widely)
- Admin dashboard still reads Supabase (deferred at Day 6) → admin CSV/PDF/delete won't work against
  Firebase yet. Documented; not on the student critical path.
- Server-side PDF report → currently printable HTML; acceptable for launch, flagged.
- Password reset flow not wired (document as post-release unless quick).

## High priority
- Route audit across `/ru` `/kk` `/en` for the student flow (loads, mobile, empty/error states,
  one CTA, no missing i18n keys, no demo copy).
- Auth redirect logic (no onboarding → onboarding; onboarding done, no assessment → assessment;
  results → dashboard) without loops.
- Security spot-check (no secrets committed, rules restrict student data, API routes verify tokens).

## Medium / low
- Visual polish sweep (spacing, hierarchy, motion) — `/design-shotgun` is interactive and not run in
  this background session; folded into manual polish.
- Accessibility + performance sweeps.
- Analytics event wiring completeness.

## Will fix today (this pass)
1. **Deploy to Cloud Run** (europe-west1) + verify production URL (`/api/health`, `/ru`, sign-up).
2. `robots` noindex.
3. Security spot-check + `SECURITY_FINAL_REVIEW.md`.
4. Route-audit pass on the student flow (delegated), fixing crashers / missing states.
5. Day-7 docs: `DAY_7_NOTES.md`, `DEPLOYMENT_FINAL.md`, `ROLLBACK.md`, `HANDOFF.md`,
   `PUBLIC_LAUNCH_CHECKLIST.md`, `POST_LAUNCH_BACKLOG.md`, updated `KNOWN_LIMITATIONS.md`.

## Postponed (with reason)
- **Admin → Firebase cutover** (admin not on student critical path; larger change; documented).
- **Dialogflow CX agent** (needs console agent creation; AI stays safely disabled).
- **Server-side PDF in Cloud Storage** (printable HTML works; post-release).
- **Human translation review, methodology validation, official university data** (post-launch backlog).
- **Interactive design shotgun, full a11y/perf audits** (need human-in-the-loop / dedicated passes).
