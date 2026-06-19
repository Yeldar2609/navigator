# Day 5 Notes — Hardening

Day 5 ("harden, polish, build trust") is a large QA/polish spec. This pass establishes the
**verified baseline**, lands the two highest-leverage, explicitly-requested hardening items, and
documents the security/a11y/i18n posture. Many Day-5 acceptance items were already satisfied by
the Day 1–4 work; those are mapped below, and the remaining polish is categorized.

## Baseline (no critical failures)
`typecheck` clean · `lint` 0 warnings · **52 unit tests** · production build (47 routes) ·
**17 e2e** green. No route crashes; all 14 main routes build and smoke-pass in en/ru/kk.

## Shipped this pass
- **Deep i18n parity guard** (`tests/unit/i18n-parity.test.ts`): recursively compares every leaf
  key path across en/ru/kk and **reports the exact missing/extra paths** on failure; also fails if
  any leaf is left as the `TODO_TRANSLATION_REVIEW` placeholder. (Compile-time `: Messages` typing
  already enforces parity; this adds runtime reporting per the spec.)
- **Skip-to-content link** (`app/[lang]/layout.tsx`): localized (`common.skipToContent` ×3),
  first focusable element, targets `#main-content` on the app shell + landing (`tabIndex={-1}`).
- **Docs:** `SECURITY_REVIEW.md`, `ACCESSIBILITY.md`, `I18N_QA.md`, `KNOWN_LIMITATIONS.md`,
  this file.

## Day-5 acceptance — already covered (Days 1–4), now verified
- **No missing translation keys** → compile-time typing + the new deep parity test.
- **Student cannot access admin** → `/api/admin/students` returns 403 for non-staff
  (`lib/admin/access.ts`, unit-tested); demo is an open preview (no auth anywhere in demo).
- **Main student flow works on mobile** → responsive shell + fixed mobile bottom-nav
  (`mobile-nav.spec.ts`); journey/dashboard/plan/check-in e2e green.
- **AI fallback works** → offline mock in demo + `chat.errorConnect` fallback on failure;
  crisis safety short-circuit (`safety.test.ts`, `chat.spec.ts`).
- **Error/empty states are friendly** → `EmptyState`/`LoadingState`/`ErrorState`,
  `ConfidenceBoost`/`SmallWin`/`Milestone`, and server-authoritative APIs that fail soft.
- **Reduced motion** honored throughout; **state not by color alone** (`aria-pressed`/`aria-current`).

## Remaining Day-5 polish (categorized — none block the demo)
**Medium**
- Results "How we calculated this" + per-career "Why this appears" collapsibles (methodology
  transparency). *(Recommend next — high trust value, low risk.)*
- Consolidate error UX: `AppErrorState` + `RetryButton` + lightweight Toast.
- Rate-limit placeholder on `/api/chat` (per-user dev guard).
- Mobile-viewport assessment-flow e2e; no-result empty-state e2e.

**Low**
- Full focus-trap in the admin drawer/dialog; axe/contrast audit in CI.
- Performance sweep (bundle/animation/list) — no obvious problems observed.
- Server-side PDF export (printable HTML ships today; see `REPORTS.md`).

## Commands
`npm run typecheck` · `npm run lint` · `npm run test` · `NEXT_PUBLIC_DEMO_MODE=on npm run build`
· `npm run test:e2e`
