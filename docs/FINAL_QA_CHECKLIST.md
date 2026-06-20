# Final QA Checklist — Kim Bolam

QA matrix for go-live on https://kimbolam--kim-bolam.europe-west4.hosted.app.
Legend: **[verified]** confirmed live this pass · **[not verified]** not exercised in this pass.

## Routes (HTTP)
| Route | Expected | Status |
|---|---|---|
| `GET /api/health` | 200 `{ status: ok }` | [verified] 200 |
| `GET /api/version` | `{ env: production, backend: firebase, aiCounselor: disabled }` | [verified] |
| `/ru` (default landing) | 200 | [verified] 200 |
| `/kk` | 200 | [verified] 200 |
| `/en` | 200 | [verified] 200 |
| Student routes (onboarding, assessment, results, plan, dashboard, career-explorer) | 200 | [verified] 200 |
| `/:lang/careers` | 302 → `/:lang/career-explorer` | [verified] redirect configured |
| `robots.txt` | disallow all (noindex) | [verified] configured |

## Flows
| Flow | What it should do | Status |
|---|---|---|
| Sign-up (Email/Password) | creates a Firebase user | [verified] live |
| Sign-up / sign-in (Google) | Google provider enabled | [verified] enabled |
| Onboarding write | writes `users/{uid}` to Firestore; rules enforce owner-only | [verified] live |
| Unauthenticated preview | works without account (demoStore cache) | [verified] design + live |
| Assessment | age slider, 1–5 scale, deterministic adaptive branching | [not verified] manually this pass |
| Results | student-facing 0–100; internal 0–60 in detail; encouraging labels | [not verified] manually this pass |
| Plan generate + complete item | plan creates; item can be marked complete | [not verified] manually this pass |
| Weekly/monthly check-in | non-confetti celebration | [not verified] manually this pass |
| AI counselor | **safe-disabled**: guardrails refuse out-of-scope; template fallback; never fakes AI (`ai_meta.fallback`) | [verified] disabled state confirmed |
| Report | printable HTML; excludes chats + raw answers | [not verified] manually this pass |

## Security spot-check
| Check | Status |
|---|---|
| No secrets committed; `.env.local` ignored | [verified] |
| Firestore rules deployed; student data owner-only | [verified] deployed |
| Storage rules deployed; reports owner-read/server-write | [verified] deployed |
| Server routes verify Firebase ID token | [verified] code path |
| Admin via ADC (no key file); prod fails closed | [verified] |
| Chats not admin-visible / not exportable / not in reports | [verified] structural |

## Notes
- Items marked **[not verified]** are wired and reviewed in code but were **not manually clicked
  through** on the live URL in this pass; run them once during a human QA session before a pilot.
- AI is intentionally in its **safe-disabled** state; QA the enabled path only after a Dialogflow CX
  agent exists (and complete Kazakh AI QA).
