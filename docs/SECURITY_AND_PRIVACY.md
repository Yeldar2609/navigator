# Security & Privacy — Kim Bolam

Complements the existing `PRIVACY_AND_SAFETY.md` and `SECURITY_REVIEW.md` with the Day-6
Firebase/AI posture.

## Identity & authorization
- All sensitive server routes verify the **Firebase ID token** (`getAuthedUser` in
  `lib/firebase/admin.ts`). Identity (uid) is derived from the verified token, never from the request
  body. Client-supplied user IDs are never trusted.
- **Students** can access only their own data (`/users/{uid}` tree — enforced by Firestore rules).
- **Admins** are authorized by a Firebase custom claim (`admin: true`) checked server-side, and operate
  **only** through authorized server routes scoped to their organization.

## What admins can and cannot do
- **Can:** student list, filter, view report, export CSV, export PDF, delete student history, view
  aggregate metrics.
- **Cannot:** see student **chat history** (no rule or route exposes it), export chats, read raw answers
  (unless a protected, default-OFF admin setting is explicitly enabled), or access unrelated data.

## Chat privacy
- Students initiate every chat; no unsolicited AI messages. Post-check-in motivation happens only
  inside the user-initiated flow.
- Chats are private to the user, **not** admin-visible, **not** exportable, and **never** included in
  PDF reports or CSV exports.
- Stored AI metadata: provider, agent id, language, safety status, timestamp, fallback flag — not chat
  content in any export.
- Chat input shows: *"Do not share personal documents or sensitive information in chat."*

## Reports
- Private; stored under `reports/{uid}/` in Cloud Storage. `storage.rules` allow read only to the owner;
  writes are server-only. Admin access is via an authorized server route issuing a **signed URL**.
- Reports exclude chat history, raw answers, and sensitive private notes.

## Firestore / Storage rules (defense in depth)
- `firestore.rules`: owner-only `/users/{uid}`; public-read catalogs; default-deny everything else
  (server-only via Admin SDK).
- `storage.rules`: owner-only `reports/{uid}/**`; default-deny.

## Fail-closed & mock modes
- Production fails closed: `assertProductionEnv()` throws on missing critical env when
  `APP_ENV=production`. Demo mode and the AI mock are disabled in production.
- AI guardrails + the local safety classifier run **before** any model call and work even with no AI
  configured.

## Auditing
- Admin deletes/exports are recorded in server-only `auditLogs` / `adminActions` collections.

## Secrets
- No secrets in source/docs/logs. `.env.local` (dev), Secret Manager (prod). See `SECRETS_SETUP.md`.
