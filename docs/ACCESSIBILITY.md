# Accessibility

State as of Day 5. Navigator targets calm, low-stress use by teenagers, including on phones.

## In place

- **Skip-to-content link** — localized, first focusable element in `app/[lang]/layout.tsx`,
  targets `#main-content` (app shell + landing). Visible only on focus.
- **Visible focus** — interactive controls use `focus-visible:ring-*` (buttons, assessment
  options, links); `main` is focusable (`tabIndex={-1}`) for the skip target.
- **Keyboard** — auth/onboarding/check-in forms are native inputs/buttons; the assessment scale,
  plan checklist, chat input (Enter to send), and admin filters are real `<button>`/`<select>`/
  `<textarea>` elements, tab-navigable.
- **State not by color alone** — selected/active states use `aria-pressed` / `aria-current`
  (assessment scale, plan items, nav, horizon chips, section map, check-in scale).
- **Icon-only buttons** carry `aria-label` (drawer close, score ring, language switcher).
- **Reduced motion** — all Framer Motion honors `useReducedMotion` / `prefers-reduced-motion`
  (score ring, cards, celebrate checkmark, small-win, chat).
- **Semantic structure** — one `<h1>` per page, sectioned `<h2>`/`<h3>`; `role="dialog"` +
  `aria-modal` on the admin drawer; `role="status"`/`aria-live` on loading.
- **Tap targets** — assessment options are min-height 52px; mobile bottom-nav items are full-cell.
- **Color tokens** — HSL design tokens chosen for contrast on calm backgrounds.

## Known gaps (tracked, post-MVP)

- No automated axe/contrast audit in CI yet.
- Drawer/dialog focus-trap is basic (overlay click + Esc-equivalent close button; no full focus
  cycle trap).
- Form-level error summaries are minimal; field-level validation is via the API/Zod messages.
- Not yet screen-reader tested end-to-end.
