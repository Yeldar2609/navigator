# Public Launch Checklist — Kim Bolam

The app is **already live and public** at
https://kimbolam--kim-bolam.europe-west4.hosted.app. These are the gates to clear before
**promoting it widely** (indexing, sharing the link broadly, onboarding a school/pilot).

## Already done (verified at go-live)
- [x] Deployed to App Hosting (public), backend `kimbolam`, europe-west4.
- [x] `GET /api/health` 200; `GET /api/version` → `{ env: production, backend: firebase, aiCounselor: disabled }`.
- [x] `/ru` `/kk` `/en` and student routes 200.
- [x] Auth live end-to-end (Email/Password + Google); onboarding writes `users/{uid}`.
- [x] Firestore + Storage rules deployed (owner-only).
- [x] Branding is "Kim Bolam"; `/careers` → `/career-explorer` redirect in place.
- [x] No secrets committed; admin via ADC; production fails closed.

## Gates before widening exposure
- [ ] **Flip robots to allow indexing** when the team is ready: change `app/robots.ts`
      (`disallow: '/'` → `allow: '/'`) **and** `app/[lang]/layout.tsx` metadata
      (`robots: { index: true, follow: true }`), then redeploy. (Currently noindex on purpose.)
- [ ] **AI counselor decision** — either keep it **disabled** (safe template fallback, current
      state) or create the Dialogflow CX agent and set the CX env vars (`HANDOFF.md`). If enabled,
      complete **Kazakh AI QA** first.
- [ ] **Admin cutover** — the admin dashboard still reads Supabase. Cut it to Firebase before relying
      on admin CSV/PDF/delete against live data; re-run `SECURITY_FINAL_REVIEW.md` for the admin
      surface afterward.
- [ ] **Password reset flow** — wire the Firebase password-reset email before broad self-serve
      sign-ups (currently not wired).
- [ ] **First admin bootstrapped** — set the `admin: true` custom claim for the owner uid
      (`HANDOFF.md`).
- [ ] **Custom domain (optional)** — map a friendly domain to the App Hosting backend instead of the
      `*.hosted.app` URL.

## Content / trust gates (see POST_LAUNCH_BACKLOG.md)
- [ ] Salary/demand data labeled as curated estimates with provenance (already labeled; verify before
      a real pilot).
- [ ] University-program data verified against official sources.
- [ ] Human translation review (ru/kk/en).
- [ ] Methodology validation note visible where results are shown.
