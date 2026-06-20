# Environment Variables (Final) — Kim Bolam

Authoritative reference for every env var, where it is set, and its sensitivity.

## Key facts
- **No secrets are committed and none need to be.** The only Firebase values used in production are
  the **public web config** (`NEXT_PUBLIC_FIREBASE_*`), which are public by design — they already
  ship in the browser bundle and are gated by Firestore/Storage rules, not by being hidden.
- **Admin credentials use ADC, not a key file.** Org policy
  `iam.disableServiceAccountKeyCreation` blocks downloadable service-account keys. App Hosting and
  Cloud Run provide **Application Default Credentials** through the runtime service account; locally
  run `gcloud auth application-default login`. There is **no key file anywhere** in the repo.
- `NEXT_PUBLIC_*` vars are inlined at **build time** (readable on client and server). Non-public
  vars are server-only at runtime.
- `.env.local` is **git-ignored** (dev only). `.env.example` holds placeholders only.

## Where values live
| Surface | Mechanism |
|---|---|
| App Hosting (prod, public) | `apphosting.yaml` `env:` block (plain public values) + ADC at runtime |
| Cloud Run (alternate, private) | `--build-arg` (public `NEXT_PUBLIC_*`) in `cloudbuild.yaml` + `--set-env-vars` at deploy + ADC at runtime |
| Local dev | `.env.local` (git-ignored) + `gcloud auth application-default login` |

## Public app vars (set in `apphosting.yaml`, BUILD + RUNTIME)
| Var | Value | Sensitivity |
|---|---|---|
| `APP_ENV` | `production` | public; triggers fail-closed (`assertProductionEnv`) |
| `NEXT_PUBLIC_APP_NAME` | `Kim Bolam` | public |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `ru` | public |
| `NEXT_PUBLIC_SUPPORTED_LOCALES` | `ru,kk,en` | public |

## Firebase web config (set in `apphosting.yaml`, BUILD + RUNTIME) — public by design
| Var | Value | Sensitivity |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy…Ig9aQ` | public-by-design (ships in bundle; not a secret) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `kim-bolam.firebaseapp.com` | public |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `kim-bolam` | public |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `kim-bolam.firebasestorage.app` | public |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `887167045950` | public |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:887167045950:web:828f58c59765dd62e2dc6f` | public |

> The Firebase Web API key is an **identifier**, not a credential. Access is enforced by Firebase
> Auth + Firestore/Storage **rules**, so this value is safe in the client bundle. This is Firebase's
> documented design.

## Server/runtime vars (App Hosting RUNTIME; equivalent on Cloud Run)
| Var | Value | Sensitivity |
|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | `kim-bolam` | non-secret |
| `REPORT_BUCKET` | `kim-bolam.firebasestorage.app` | non-secret |

## Admin credentials — ADC, no key (would-be-secret, but NOT used)
| Var | Status |
|---|---|
| `FIREBASE_ADMIN_CLIENT_EMAIL` | **unset** — would be a secret; not used (ADC instead) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | **unset** — blocked by org policy; not used (ADC instead) |
| `FIREBASE_ADMIN_USE_ADC` | `true` locally (in `.env.local`); auto-detected in prod |

ADC is detected at runtime (`lib/env.ts → isAdcAvailable`) via `K_SERVICE`/`K_REVISION`
(Cloud Run / App Hosting) or `GOOGLE_APPLICATION_CREDENTIALS` / `FIREBASE_ADMIN_USE_ADC` locally.
`isFirebaseAdminConfigured()` returns true on ADC, so `backend: firebase`.

## AI counselor (server-only) — ships DISABLED
| Var | Value to enable | Notes |
|---|---|---|
| `ENABLE_AI_COUNSELOR` | `true` | currently unset → disabled |
| `DIALOGFLOW_CX_PROJECT_ID` | `kim-bolam` | |
| `DIALOGFLOW_CX_LOCATION` | (region) | unset → disabled |
| `DIALOGFLOW_CX_AGENT_ID` | (agent id) | unset → disabled; **no agent created yet** |
| `DIALOGFLOW_CX_DEFAULT_LANGUAGE_CODE` | `ru` | |
| `ENABLE_AI_MOCK` | `false` | DEV-only; never honored in production |

`isAiCounselorConfigured()` requires `ENABLE_AI_COUNSELOR=true` **and** all three CX vars. Until
then `/api/version` reports `aiCounselor: disabled` and the counselor uses the safe template
fallback. See `CONVERSATIONAL_AGENT_SETUP.md`.

## Legacy / fallback (Supabase) — not the production backend
| Var | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | documented legacy/fallback; the **admin dashboard still reads Supabase** (post-launch cutover) |

## Dev-only
| Var | Notes |
|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `off` in prod; `on` only for a deliberate demo/e2e build. Demo mode is **fail-closed in production** (`lib/data/mode.ts`). |
