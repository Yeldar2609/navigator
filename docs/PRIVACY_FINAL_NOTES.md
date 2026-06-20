# Privacy — Final Notes (Go-Live) — Kim Bolam

Student-facing privacy guarantees at launch. Complements `PRIVACY_AND_SAFETY.md` and
`SECURITY_AND_PRIVACY.md`.

## Student data ownership
- Each student's data lives under `users/{uid}` in Firestore and is **owner-only** by rule. A signed-in
  student can read/write only their own profile, assessments, results, plans, check-ins, and chats.
- Identity is the verified Firebase uid (from the ID token), never a client-supplied id.
- Before sign-in, the unauthenticated preview tier uses a local `demoStore` (localStorage) cache —
  nothing leaves the device until the student signs in to persist results.

## Chats
- **Not exportable** — chat content is never included in CSV or PDF exports.
- **Not admin-visible** — no rule or route lets an admin read another user's chats. This is
  structural: admins operate only through scoped server routes, and none expose chats.
- **Not in reports** — PDF/printable reports exclude chat history (and raw answers).
- Students initiate every chat; there are no unsolicited AI messages.

## Chat-input privacy hint
- A subtle hint sits next to the chat input in all three locales (`PRIVACY_INPUT_HINT`):
  - en: "Do not share personal documents or sensitive information in chat."
  - ru: "Не делитесь личными документами или конфиденциальной информацией в чате."
  - kk: "Чатта жеке құжаттарды немесе құпия ақпаратты бөліспеңіз."

## Minimal AI context (no PII)
- When the AI counselor is enabled, only **minimal** context is sent to it: no name, email, school,
  or raw answers — at most a coarse age bucket (never the exact age). (`lib/ai/context-builder.ts`.)
- Currently the counselor ships **disabled** (no Dialogflow CX agent), so no chat content is sent to
  any model; the deterministic template fallback runs locally.

## Analytics
- Internal analytics store **events** (e.g. a chat-sent event, report-export event), never chat
  **content**. Stored AI metadata is provider / agent id / language / safety status / timestamp /
  fallback flag — not the message text. There is no Firebase Analytics; analytics are internal
  Firestore events.

## Reports
- Private, stored under `reports/{uid}/` in Cloud Storage (owner-read, server-write). Admin access is
  only via an authorized server route issuing a signed URL. Reports exclude chats, raw answers, and
  sensitive private notes.
