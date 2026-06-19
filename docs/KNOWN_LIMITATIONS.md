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
