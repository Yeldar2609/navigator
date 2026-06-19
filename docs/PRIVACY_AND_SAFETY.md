# Privacy & Safety

How Navigator handles student wellbeing and personal data in the AI counselor (Day 4).

## Crisis & safety handling

A **local, dependency-free classifier** (`lib/ai/safety.ts`) runs on every message *before* any
AI call — so safety works even with no moderation API and no LLM key. It matches self-harm /
suicide / abuse signals across English, Russian, and Kazakh.

On a crisis signal, the counselor:
- **stops career coaching for that turn**;
- responds with calm care and validation;
- urges the student to reach a **trusted adult** (parent, teacher, school counselor);
- if they may be in danger, points to **local emergency services — in Kazakhstan, 112**
  (a real, verifiable number; no invented hotlines);
- does **not** attempt therapy or diagnosis.

This is a safety fallback, not clinical care, and is documented as such. Harmful requests (e.g.
how to hurt someone) are refused safely while still offering study/career help.

**Limitations:** the classifier is a keyword/phrase heuristic — it can miss indirect phrasing or
over-trigger on idioms. It errs toward safety (a false positive only surfaces a supportive
message). It is not a substitute for trained humans or a monitored crisis service.

Tested in `tests/unit/safety.test.ts` (crisis examples in all three languages, harmful requests,
and ordinary career questions as negatives).

## What data is sent to the AI

Only a **minimal snapshot** (`lib/ai/snapshot.ts`) — deliberately **no PII**:

- Sent: grade level, preferred language, top route, top clusters, awareness level, readiness %,
  strengths, growth areas, recommended career slugs, skill gaps, a plan summary (counts + next
  action), and check-in averages.
- **Not sent:** name, email, school, exact age/birthdate, free-text personal notes, IDs, address.

The counselor also never asks for sensitive personal data (national ID, address, documents).

## Where the API key lives

The LLM key (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) is read **server-side only** (`lib/ai/client.ts`,
called from `/api/chat`). It is never inlined into the browser bundle and never returned to the
client. In demo mode there is no key at all — the safe mock runs locally.

## What is stored

- **Demo (no Supabase):** the chat thread lives in the browser's localStorage only.
- **Configured (Supabase):** `chat_threads` / `chat_messages`, RLS-scoped so a student can only
  read/write their own. The user message stores a moderation category; no extra profiling.

## Out of scope (MVP)

No parental-consent workflow, no third-party analytics on chat content, no automated escalation
to humans. These are explicitly deferred and should be revisited before a real pilot.
