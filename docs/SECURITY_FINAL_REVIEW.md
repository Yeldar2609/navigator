# Security — Final Review (Go-Live) — Kim Bolam

Checklist confirming the production security posture at launch. Complements
`SECURITY_AND_PRIVACY.md`, `SECURITY_REVIEW.md`, and `PRIVACY_AND_SAFETY.md`.

## Secrets & config
- [x] **No secrets committed.** The repo contains no service-account key and no private credentials.
- [x] **`.env.local` is git-ignored** (dev only); `.env.example` holds placeholders only.
- [x] **Firebase web config is public-by-design**, not a secret. The `NEXT_PUBLIC_FIREBASE_*` values
      in `apphosting.yaml` already ship in the browser bundle; access is enforced by Auth +
      Firestore/Storage rules, not by hiding the config. (See `ENVIRONMENT_VARIABLES_FINAL.md`.)
- [x] **Admin via ADC, no key file.** Org policy `iam.disableServiceAccountKeyCreation` blocks
      downloadable keys; production uses Application Default Credentials through the runtime service
      account (`lib/firebase/admin.ts` → `applicationDefault()`).

## Identity & authorization
- [x] **Server routes verify the Firebase ID token** (`getAuthedUser` in `lib/firebase/admin.ts`);
      uid is derived from the verified token, never from the request body. Client-supplied user IDs
      are never trusted.
- [x] **Firestore rules restrict students to their own data** — `/users/{uid}` tree is owner-only;
      curated catalogs are public-read; everything else is default-deny (server-only via Admin SDK).
      No client path exposes another user's data. Rules are **deployed**.
- [x] **Storage rules restrict reports** — `reports/{uid}/**` readable only by the owner; writes are
      server-only. Rules are **deployed**. Bucket `kim-bolam.firebasestorage.app` (europe-west1).
- [x] **Chats are owner-only and never admin-visible** — no rule or route exposes another user's
      chats; admins cannot read, export, or see chat content. Chats are excluded from PDF reports and
      CSV exports structurally (admins operate only through scoped server routes).

## Fail-closed & mock disablement
- [x] **Production fails closed** — `assertProductionEnv()` (`lib/env.ts`) throws when
      `APP_ENV=production` and a required public var or admin credential is missing. Verified live:
      `/api/version` returns `{ env: production, backend: firebase }`, i.e. it started cleanly with
      full config.
- [x] **Demo / mock disabled in production** — `isDemoMode()` (`lib/data/mode.ts`) returns false
      when Firebase is configured and is fail-closed outside an explicit demo build; the AI mock
      (`isAiMockEnabled`) is never honored when `isProd()`.

## AI counselor
- [x] **Ships disabled** (`aiCounselor: disabled`); no Dialogflow CX agent exists. Deterministic
      safety + scope guardrails run **before** any model call, and the template fallback never
      presents itself as a real AI (`ai_meta.fallback`).

## Org posture (DRS)
- [x] **Domain Restricted Sharing** (`iam.allowedPolicyMemberDomains`) blocks `allUsers`, so the
      Cloud Run alternate stays private. The public surface is **App Hosting**, which does not rely
      on an `allUsers` grant. This is an intentional, documented posture (see `DEPLOYMENT_FINAL.md`).
- [x] **Not indexed yet** — `app/robots.ts` disallows all and page metadata sets
      `robots: { index: false, follow: false }`.

## Auditing
- [x] Admin deletes/exports recorded in server-only `auditLogs` / `adminActions` collections
      (active once the admin path is cut to Firebase).

## Follow-up to re-verify at admin cutover
- [ ] **Admin dashboard still reads Supabase** (deferred). When it is cut over to Firebase, re-run
      this review for the admin surface: confirm admin routes verify the `admin: true` custom claim
      server-side, that admins still cannot reach chats, that exports exclude chat/raw answers, and
      that audit logging is wired. Until cutover, the admin path is **not** on the student critical
      path and is not publicly reachable.
