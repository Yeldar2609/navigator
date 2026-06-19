# Security Review

Posture as of Day 5. Demo mode is the tested path; the configured (Supabase) path is
implemented to the same patterns but is not exercised by the e2e suite.

## Secrets

- **Service-role key:** never used in the browser. `lib/supabase/browser.ts` uses only the
  anon key; server clients use server env only. Demo mode stores **no** secrets (localStorage
  holds profile/answers/results/plan/check-ins/chat only).
- **AI API key:** read **server-side only** (`lib/ai/client.ts`, called from `/api/chat`).
  Never inlined into the client bundle. Demo runs the offline mock with no key.
- **Demo fail-closed:** `isDemoMode()` only activates when Supabase is unconfigured AND
  (dev OR `NEXT_PUBLIC_DEMO_MODE=on`) — demo can't silently turn on in production.

## API routes — server-authoritative pattern

Every mutating route validates with Zod, authenticates the user, resolves the **profile from
the authed session** (never trusts a client-supplied `profile_id`/owner id), checks query
errors, and relies on RLS. Audited routes:

- `assessment/submit`, `plan/generate`, `plan/update` — resolve the student server-side; ignore
  client ids; template/ownership-scoped; completeness guard on submit. `plan/update` surfaces a
  0-row update as `not_found` (no silent success).
- `chat` — auth + moderation + own-thread check + minimal snapshot; persists RLS-scoped.
- `check-ins/create` — links the student's **own** latest plan (never a client-supplied plan id).
- `results/compare` — only compares results scoped to the caller's `profile_id`; no leaking
  another user's result via `result_id`.
- `admin/students` — **403** unless the caller holds a staff role
  (`organization_memberships` ∈ teacher/admin/super_admin); returns only same-organization
  students. Students are never admins (`lib/admin/access.ts`, unit-tested).

## RLS (supabase/migrations/0001_init.sql)

Per-table "own row" policies via `profile_id IN (select id from profiles where auth_user_id =
auth.uid())` for: profiles, sessions, answers, results, plans, plan_items, check_ins,
chat_threads, chat_messages, exports. `organization_memberships` gates admin reads. Reference
tables (templates, questions, careers, majors, organizations) are world-readable.

## Known gaps (tracked)

- Configured Supabase path is untested by e2e (demo is the verified path).
- Server-side `plan_items` id threading for configured-mode progress updates (demo unaffected).
- No rate limiting on `/api/chat` yet (placeholder — add a per-user limiter before a real pilot).
- No parental-consent workflow (MVP scope).
