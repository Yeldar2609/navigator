# AI Counselor — Behavior

The AI counselor exists because most students in the MVP's audience have no access to a
human college counselor. It is a **supportive guide, not an authority** — and never the
source of truth for the assessment.

## Hard rules (enforced by design)

1. **It never decides or overrides the canonical score.** Scoring is deterministic
   (`lib/methodology/scoring.ts`). The counselor only *explains and builds on* the result it
   is given. The system prompt states this explicitly, and the snapshot is read-only.
2. **It does not invent official facts.** Real university admissions requirements, live
   salaries, official course links, and labor-market numbers are out of scope. When asked, it
   says it can help explore generally but official details need verified sources + a trusted
   adult (`counselor.needsVerification`).
3. **It is supportive, not falsely authoritative.** It never says "you must become X." It says
   "based on your current profile, you may want to explore…". It explains reasoning from the
   student's profile factors (route, cluster, strengths).
4. **Safety first.** Crisis/self-harm/abuse signals short-circuit career coaching and return a
   safe, caring response (see PRIVACY_AND_SAFETY.md). It avoids clinical/diagnostic language
   and never attempts therapy.

## Architecture (`lib/ai/`)

- `safety.ts` — local, dependency-free crisis/harm classifier (en/ru/kk). Always the gate.
- `moderation.ts` — wraps the local classifier; a spot to add an external moderation API later.
- `snapshot.ts` — the **minimal** student picture sent to the model (no PII — no name, email,
  school, or exact age; only grade, route, clusters, scores, strengths, recommended careers,
  plan summary, check-in averages).
- `system-prompt.ts` — the real-LLM system prompt embedding the rules + snapshot.
- `client.ts` — **server-only** provider-agnostic LLM client over `fetch` (no SDK dep). Reads
  `ANTHROPIC_API_KEY` (preferred) or `OPENAI_API_KEY`; 20s timeout; retries once; returns
  `null` (→ safe mock) when no key or on failure. Model override via `NAV_AI_MODEL`.
- `counselor.ts` — the **deterministic, profile-aware mock** used in demo mode (and as a
  no-key server fallback). Intent detection → localized templates → suggested questions +
  action cards. Safe by construction (runs the safety gate first).
- `tools.ts` — maps action kinds (explore careers / build plan / open plan / view results /
  start assessment) to in-app routes.
- `schemas.ts` — Zod for the chat response + the structured AI plan.
- `fallback.ts` — localized "can't connect" message.

## Demo vs configured

- **Demo (no Supabase, no key):** the client runs the safe mock locally (`lib/data/chat.ts`),
  builds the snapshot from the local store, and persists the thread in localStorage. No network,
  no key — the demo is fully functional and coherent.
- **Configured (Supabase):** the client calls `/api/chat`. The server authenticates, moderates,
  builds the snapshot from the DB, calls the real LLM if a key is set (else the same mock), and
  persists messages (RLS-scoped). The API key never reaches the browser.

## Response shape

`{ thread_id, assistant_message, suggested_questions, suggested_actions,
referenced_profile_factors, safety_notice_optional }`. The UI renders bubbles + action cards +
an expandable "Why am I seeing this?" (the referenced profile factors) + a standing disclaimer.

## What it helps with

Explaining results, why-this-route, which careers to explore first (from the seed catalog),
skills to build, subjects that matter, building/adjusting plans, preparing a parent conversation,
and lowering pressure when a student is anxious or unsure.
