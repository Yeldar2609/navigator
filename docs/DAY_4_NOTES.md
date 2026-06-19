# Day 4 Notes

Day 4 ("make the core MVP feature-complete") is a large, multi-system spec. This pass lands the
**centerpiece — the AI counselor with safety — fully built and verified**, plus its docs. The
remaining Day-4 systems are scoped below as the continuation (deferred, not half-built).

## Shipped this pass (verified: typecheck + lint + 44 unit tests + build + e2e)

### AI counselor architecture (`lib/ai/`)
`safety.ts` (local crisis/harm classifier, en/ru/kk), `moderation.ts`, `snapshot.ts` (minimal,
no-PII student picture), `system-prompt.ts`, `client.ts` (server-only, provider-agnostic
`fetch` client — Anthropic→OpenAI→null; 20s timeout; retry once; `NAV_AI_MODEL` override),
`counselor.ts` (deterministic, profile-aware mock = the demo brain + no-key fallback),
`tools.ts` (action→route), `schemas.ts` (Zod chat + structured plan), `fallback.ts`.
- **No API key → safe offline mock**, clearly the demo path. Key (when present) is read
  **server-side only**; never in the browser.

### AI counselor endpoint (`/api/chat`)
Server-authoritative: validate (Zod) → moderate → resolve/own thread → build snapshot from the
DB → real LLM if configured, else the safe mock → persist user+assistant messages (RLS-scoped)
→ return `{ thread_id, assistant_message, suggested_questions, suggested_actions,
referenced_profile_factors, safety_notice_optional }`. Demo install returns the safe mock.

### System prompt + safety
Strong system prompt (`system-prompt.ts`): reply in the student's language; canonical score is
read-only; supportive not authoritative; no invented official facts; crisis → safe response +
trusted adult + 112; never ask for PII. Crisis short-circuits coaching in both the mock and the
endpoint. See `docs/AI_COUNSELOR_BEHAVIOR.md`, `docs/PRIVACY_AND_SAFETY.md`.

### Chat UI (`/[lang]/chat`)
Real message thread (bubbles + Bot avatar), contextual prompt chips (before-result /
after-result / after-plan), "Thinking about your path…" state, assistant **action cards**
(explore / build plan / open plan / results / assessment), expandable **"Why am I seeing
this?"** (referenced profile factors), standing disclaimer, friendly empty state, error
fallback, send/receive animation. Demo runs the counselor locally and persists the thread in
the local store; configured mode calls `/api/chat`.

### Tests
- `tests/unit/safety.test.ts` — crisis (en/ru/kk), harmful, and ordinary-question negatives.
- `tests/e2e/chat.spec.ts` — counselor reply + crisis safe-fallback in demo mode.

### Suggested chat prompts (deliverable 4)
Contextual chips wired from `d4.prompts` (before / after results / after plan).

## Remaining Day-4 deliverables (continuation — best done as fresh increments)
Substantial new systems; deferred rather than half-built:
1. **AI structured plan generation** — upgrade `/api/plan/generate` to optionally personalize via
   the LLM against `aiPlanSchema` (already defined in `lib/ai/schemas.ts`); deterministic template
   stays the fallback; store `plan_source` = `ai_generated | template_generated`.
2. **Retake assessment + comparison** — retake button (new session), `/api/results/history`,
   `/api/results/compare`, and a non-judgmental comparison UI (route/score/cluster deltas,
   consistent strengths, "changing results is normal", assessment timeline).
3. **Progress tracking** — dashboard result-history mini chart + check-in trend + supportive
   insight ("confidence rose after completing plan actions").
4. **Admin dashboard v1** — `/[lang]/admin` with role guard (student blocked), summary cards,
   student table + filters, student detail drawer, view-report action.
5. **Reports & export** — `POST /api/export/student-report` → printable HTML (PDF as documented
   TODO), `exports` metadata, Supabase Storage when configured.
6. **Post-login routing** — onboarding-incomplete → onboarding; no result → assessment; else
   dashboard.
7. **Docs** — `ADMIN_DASHBOARD.md`, `REPORTS.md` (AI counselor + privacy/safety docs already written).

## Configuration
- AI: set `ANTHROPIC_API_KEY` (preferred) or `OPENAI_API_KEY` server-side to enable the real LLM;
  optional `NAV_AI_MODEL`. With no key, the safe offline mock runs (the demo default).
- Run/build unchanged: `NEXT_PUBLIC_DEMO_MODE=on npm run build` for the demo/e2e build.

## Non-negotiables held
Deterministic scoring stays canonical (AI explains, never decides) · API key server-only, never in
the browser · no invented admissions/salary/official facts (verification prompt instead) · crisis
safety fallback before any coaching · no PII sent to the AI · no hidden assumptions (provider
default documented; mock is the explicit demo path).
