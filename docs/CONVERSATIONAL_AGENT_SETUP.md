# Conversational Agent Setup — Kim Bolam AI Counselor

Backend: **Google Conversational Agents / Dialogflow CX**, project `kim-bolam`.
The app NEVER calls Google from the browser — only the server route `app/api/chat/route.ts` calls
`lib/ai/dialogflow-client.ts`.

## Current state (honest)
No agent exists yet, so `DIALOGFLOW_CX_LOCATION` and `DIALOGFLOW_CX_AGENT_ID` are blank. With them
blank, `isAiCounselorConfigured()` is false and the counselor runs in a **production-safe state**:
guardrails + safety still apply, and replies come from the deterministic template counselor
(`lib/ai/counselor.ts`) clearly marked `ai_meta.fallback = true`. **We never present the fallback as
a real AI agent.**

## Create the agent
1. Console → **Conversational Agents (Dialogflow CX)** → Create agent → project `kim-bolam`.
   Pick a region (e.g. `us-central1` or `global`); record it as `DIALOGFLOW_CX_LOCATION`.
2. Default language **ru**; add **kk** and **en** as supported languages.
3. Copy the **Agent ID** → `DIALOGFLOW_CX_AGENT_ID` (store both in Secret Manager).
4. Configure the agent persona/policy to match `lib/ai/counselor-system-policy.ts`:
   - Persona: professional counselor + calm coach + friendly peer; no emojis; short by default.
   - Formal tone in ru/kk; warm-professional in en; reply in the session language.
   - **In scope:** results, careers, majors, courses, universities (general only), subjects, skills,
     projects, plans, check-ins, post-check-in motivation, parent-conversation coaching, choosing
     between recommended options.
   - **Refuse/redirect:** coding, math/homework, unrelated chat, medical, therapy, illegal/harmful,
     sensitive-data requests. (The app also enforces these in `counselor-guardrails.ts` before calling
     the agent — defense in depth.)
   - Never invent universities/admissions/salaries; defer to official sources + a trusted adult.
5. Grant the service account (`FIREBASE_ADMIN_CLIENT_EMAIL`) the **Dialogflow API Client** role.
6. Set `ENABLE_AI_COUNSELOR=true`. Redeploy.

## Session context sent to the agent
`lib/ai/context-builder.ts` builds the MINIMAL context (Dialogflow session parameters): language,
grade, age range (coarse bucket — never exact age), latest route, top clusters, qualities, growth
areas, recommended careers, active-plan summary, recent check-in summary. It deliberately excludes
school code, admin data, raw answers, name, and email.

## Plan suggestions
The AI may *suggest* plan edits but must not overwrite a plan. Suggested edits are returned to the UI
which shows **Apply / Cancel**; applied changes are stored as user-confirmed with provenance
`dialogflow_cx_ai_suggestion`. (UI wiring is a documented extension point.)

## Privacy
Students initiate every chat (no auto-messages). Chats are private to the user, are **not** visible to
admins, are **not** exportable, and are **never** included in PDF reports or CSV exports. Store AI
metadata (provider, agent id, language, safety status, timestamp, fallback flag) with messages.
The chat input shows: *"Do not share personal documents or sensitive information in chat."*
(`PRIVACY_INPUT_HINT` in `counselor-guardrails.ts`).
