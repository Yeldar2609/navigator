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
