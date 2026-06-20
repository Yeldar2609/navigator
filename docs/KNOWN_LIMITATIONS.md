# Known Limitations (MVP)

Honest list of what is intentionally simplified or deferred. None of these block the demo; they
are the agenda before a real school/government pilot.

## Data & methodology
- **No real KZ data.** Career `marketRelevance` and majors are **curated demo data**, labelled as
  such, with TODOs to integrate real labor-market + university-program sources.
- **Productized methodology.** Awareness 0–60 derivation, cluster mapping, and route tie-breaks
  use documented, configurable defaults (`docs/METHODOLOGY_ASSUMPTIONS.md`) pending the validated
  thesis instrument (exact items, cluster key, awareness formula).

## AI counselor
- **Demo uses a deterministic mock** (no API key). The real LLM path is implemented but only runs
  when a key is configured server-side; that path is not exercised by the e2e suite.
- **Safety is a heuristic.** The crisis classifier is keyword/phrase-based (en/ru/kk) — it can
  miss indirect phrasing or over-trigger; it errs toward safety and is not a monitored crisis
  service. No automated human escalation.
- **No rate limiting** on `/api/chat` yet.

## Auth & backend
- **Demo has no auth.** The whole demo is open (consistent across routes); role-based access
  (incl. student-cannot-access-admin) is enforced on the **configured** path only.
- **Configured (Supabase) path is untested** by e2e — implemented to the server-authoritative +
  RLS patterns but not exercised here.
- **Server-side `plan_items` id threading** for configured-mode progress updates is a TODO (demo
  path unaffected; the update route fails soft with `not_found`).

## Reports & admin
- **Reports are printable HTML** (`window.print()` of a print-only layout). Server-side PDF export
  (`/api/export/student-report` + `exports` + Supabase Storage) is post-MVP.
- **Admin shows sample students** in demo; real installs query the organization.

## Platform
- Builds/e2e run against the production server because dev compile is too slow under OneDrive;
  the demo/e2e build needs `NEXT_PUBLIC_DEMO_MODE=on`.
- No parental-consent workflow (MVP scope).
- No automated a11y/contrast audit in CI; not yet screen-reader tested end-to-end.

## Day 6 — production build, Firebase/Google migration, AI counselor (honest list)
- **Assessment** is based on the thesis structure but **rewritten and productized**; the adaptive
  branching is deterministic/productized and **not yet externally psychometrically validated**.
- **Retake interval (2 months) is guidance, not enforced** — `retakeAssessment()` currently allows
  immediate retakes; the interval gate is a documented extension point.
- **Salary/demand data** must show source/provenance and may be **curated estimates** until verified
  against official KZ sources (Enbek, stat.gov.kz). See `DATA_SOURCES.md`.
- **AI counselor** is guidance — **not** an official admissions authority, therapist, or human
  counselor. It ships **disabled-but-wired** (deterministic template fallback, `ai_meta.fallback`)
  until a Dialogflow CX agent is created; **Kazakh AI support will need additional QA**.
- **Firebase backend is added behind the data abstraction** and is typecheck/build-clean, but the
  end-to-end Firebase path (Auth + Firestore + Storage + real route cutover) is **untested without
  real credentials** (a human-only blocker). The app runs in demo mode in this build. Supabase remains
  as documented legacy/fallback.
- **AI plan-suggestion Apply/Cancel UI** and **server-side PDF→Cloud Storage** are wired in
  design/docs but the UI/route cutover is a documented follow-up.
- **Deploy is prepared, not executed** here — see the human-only checklist in `DEPLOYMENT.md` /
  `DAY_6_NOTES.md` (Firebase web app, admin key, `firebase login`/`gcloud` PATH, Dialogflow agent,
  first-admin claim).

## Day 7 — public go-live (honest list)
The app is now **LIVE and public** on Firebase App Hosting
(https://kimbolam--kim-bolam.europe-west4.hosted.app). Remaining honest limitations:
- **Adaptive assessment is productized, not validated.** The branching/scoring is deterministic and
  documented, but **not yet externally psychometrically validated** against the thesis instrument.
- **Salary / demand figures are curated estimates.** Labeled with provenance; must be verified
  against official KZ sources (Enbek, stat.gov.kz) before a real pilot.
- **University data must be verified.** Curated demo data pending official university-program sources.
- **Kazakh AI needs QA.** When the AI counselor is enabled, kk responses require additional review.
- **AI is guidance, not authority.** The counselor is **not** a human counselor, therapist, or
  official admissions authority. It ships **disabled** (deterministic guardrails + template fallback,
  `ai_meta.fallback`); enabling it requires creating a Dialogflow CX agent.
- **Admin dashboard still reads Supabase.** Deferred at Day 6/7; admin CSV/PDF/delete do not work
  against the live Firebase data until the cutover. Not on the student critical path; not publicly
  reachable. See `POST_LAUNCH_BACKLOG.md`.
- **Cloud Run cannot be made public.** Org Domain Restricted Sharing
  (`iam.allowedPolicyMemberDomains`) blocks the `allUsers` grant, so the Cloud Run service stays
  private. App Hosting is the public path; Cloud Run is the alternate/backup.
- **Password reset not wired**; **server-side PDF** is still printable HTML — both post-launch.
- **Not indexed yet** — `robots` noindex on purpose until the team is ready.
