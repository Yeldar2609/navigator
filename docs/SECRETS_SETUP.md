# Secrets Setup — Kim Bolam

**Rules:** never commit secrets; never put raw secrets in source, docs, or logs. `.env.local` for dev
(git-ignored), **Google Secret Manager** for production. `.env.example` holds placeholder names only.

> If you ever find a real secret committed to the repo, STOP, rotate it immediately, and scrub history.

## Secrets to create (production)
Create each in Secret Manager with the **same name** the app/`apphosting.yaml` expects:

| Secret name | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | web `authDomain` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | web `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | web `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | web `appId` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | *(optional)* service-account `client_email` — **omit; use ADC** |
| `FIREBASE_ADMIN_PRIVATE_KEY` | *(optional)* service-account `private_key` — **blocked by org policy; use ADC** |
| `REPORT_BUCKET` | reports bucket (e.g. `kim-bolam.appspot.com`) |
| `DIALOGFLOW_CX_LOCATION` | agent region (once created) |
| `DIALOGFLOW_CX_AGENT_ID` | agent id (once created) |

Public, non-secret values (`NEXT_PUBLIC_APP_NAME`, locales, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
`APP_ENV`) are set as plain env in `apphosting.yaml` — they are not secrets.

## Create + grant (CLI)
```bash
# create
printf 'VALUE' | gcloud secrets create FIREBASE_ADMIN_PRIVATE_KEY --data-file=- --project kim-bolam
# update later
printf 'VALUE' | gcloud secrets versions add FIREBASE_ADMIN_PRIVATE_KEY --data-file=- --project kim-bolam

# App Hosting access
firebase apphosting:secrets:grantaccess FIREBASE_ADMIN_PRIVATE_KEY NEXT_PUBLIC_FIREBASE_API_KEY ...

# Cloud Run uses --set-secrets at deploy (see DEPLOYMENT.md)
```

## Notes
- `NEXT_PUBLIC_*` are inlined at **build** time → they must be available to the build, not only at
  runtime (App Hosting handles this when the secret has `availability: [BUILD, RUNTIME]`, already set
  in `apphosting.yaml`).
- The private key contains literal `\n`; the app calls `.replace(/\\n/g, '\n')` — paste it verbatim.
- Production **fails closed**: `lib/env.ts → assertProductionEnv()` throws if a critical var is missing
  when `APP_ENV=production`.
