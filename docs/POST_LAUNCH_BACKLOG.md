# Post-Launch Backlog — Kim Bolam

Prioritized work deferred at go-live. The app is live and public; none of these block the student
critical path, but they gate a real school/government pilot.

## P0 — correctness / operability of the full product
1. **Admin dashboard → Firebase cutover.** Admin currently reads **Supabase**; admin CSV/PDF/delete
   do not work against the live Firebase data. Cut admin routes to Firestore + Admin SDK, gate on the
   `admin: true` custom claim, wire `auditLogs`/`adminActions`, then re-run `SECURITY_FINAL_REVIEW.md`
   for the admin surface. Not on the student path, but required for staff use.
2. **Password reset flow.** Wire the Firebase password-reset email before broad self-serve sign-ups.

## P1 — trust & content for a pilot
3. **Dialogflow CX agent + enablement** — create the agent, set CX env vars, flip
   `aiCounselor: enabled`. Includes **Kazakh AI QA** (kk responses need additional review before
   exposure). Until then the safe template fallback stands.
4. **Methodology validation** — validate the productized assessment (awareness 0–60 derivation,
   cluster mapping, adaptive branching) against the thesis instrument; surface a validation note
   where results are shown.
5. **Official university-program data** — replace curated demo university data with verified official
   sources.
6. **Labor-market data refresh** — replace curated salary/demand estimates with official KZ sources
   (Enbek, stat.gov.kz); keep provenance labels.
7. **Human translation review** — full ru/kk/en copy review.

## P2 — capability upgrades
8. **Server-side PDF in Cloud Storage** — replace printable HTML with a generated PDF stored under
   `reports/{uid}/` and served via signed URL.
9. **Parent view** — a read-only/guided parent surface.
10. **Notifications** — check-in reminders / progress nudges.

## P3 — reach
11. **Mobile app** — native or PWA packaging.

## Operational follow-ups (smaller)
- Flip robots to allow indexing when ready (`app/robots.ts` + layout metadata).
- Optional custom domain on the App Hosting backend.
- Rate limiting on `/api/chat`.
- Enforce the retake interval (currently guidance, not enforced).
- Automated a11y/contrast + performance audits in CI.

## Update 2026-06-20 — items completed since go-live
P0 #1 (**admin → Firebase cutover**, custom-claim gated, CSV/PDF/audited-delete), P0 #2
(**password reset**), and P2 #8 (**server-side PDF → Cloud Storage signed URL**) are **DONE**
and live. The first admin claim was minted for `yeldar@american-study.com`.

## Day-7 stabilization audit (2026-06-20) — deferred items

A 5-dimension audit of the live app ran on 2026-06-20. **Blockers fixed same day** (live):
AI counselor is disabled-safe (`/chat` shows a "coming soon" state, no fake-AI; `/api/chat`
returns 503 fail-closed); the Firestore→cache hydration race is fixed (views wait for
`hydrated`, so a returning user reloading /dashboard|/results|/plan no longer sees the empty
"take the test" state); local cache is cleared on sign-out/uid-change (shared-device isolation);
full result history is hydrated; post-sign-in routing sends returning users to their dashboard.
Auth/privacy posture verified strong (admin custom-claim gating, uid-from-token, no chat
exposure/export, no committed secrets). **Deferred (none are release blockers):**

- **Cross-device resume of an *incomplete* assessment** — answers autosave to Firestore but
  aren't re-hydrated; add `fsGetAnswers(uid)` and seed the session on sign-in. (Same-device works.)
- **Wire `assertProductionEnv()`** — the fail-closed guard exists (`lib/env.ts`) but is never
  invoked; call it from a server entry so prod truly fails closed on missing config.
- **Remove dead Supabase code paths** — `/api/chat` and several student API routes still carry an
  unused Supabase branch; migrate/delete now that the app is Firebase-only. When the AI counselor
  is enabled, `/api/chat` must verify the Firebase ID token (`getAuthedUser`), not Supabase.
- **Tighten `firestore.rules`** — students can currently write their own `assessmentResults`
  (contradicts the "server-written" comment); restrict if results must be server-authoritative.
- **`/[lang]/report` route** returns 404 (no page); add a report page or remove the reference.
  Reports currently download via `/api/report` + the results button (works).
- **A11y polish** — language-switcher tap targets <44px; hardcoded English ARIA labels for ru/kk;
  associate form errors via `aria-describedby`; nudge chat privacy-hint contrast to AA.
- **Small robustness** — check-in `save()` lacks error handling; `retakeAssessment()` doesn't reset
  the Firestore answer session; remove dead "coming soon"/"database not connected" dictionary keys.
