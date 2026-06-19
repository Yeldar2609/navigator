# Google Cloud Setup — Kim Bolam

Project: **kim-bolam** · number `887167045950` · Blaze billing enabled · admin access available.

## gcloud CLI
The SDK is installed (per project notes) but may not be on PATH. Add it, e.g.:
```
C:\Users\<you>\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin
```
Then:
```bash
gcloud --version
gcloud auth login
gcloud config set project kim-bolam
```

## Required APIs
Already enabled per project notes: IAM, Cloud Run Admin, Cloud Build, Artifact Registry, Secret
Manager. Enable any others as needed:
```bash
gcloud services enable \
  run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com iam.googleapis.com \
  firestore.googleapis.com firebasestorage.googleapis.com identitytoolkit.googleapis.com \
  dialogflow.googleapis.com \
  --project kim-bolam
```
(`identitytoolkit` = Firebase Auth; `dialogflow` only needed once the AI agent is created.)

## Service accounts & roles
- **Firebase Admin SDK** service account (`firebase-adminsdk-...@kim-bolam.iam.gserviceaccount.com`)
  needs: Firestore access, Storage object admin (for report signed URLs), and — once AI is on —
  **Dialogflow API Client**.
- **App Hosting / Cloud Run** runtime service account needs access to the secrets it reads (granted
  via `firebase apphosting:secrets:grantaccess` or Cloud Run `--set-secrets`).

## Regions
Pick one region and keep it consistent: `GOOGLE_CLOUD_REGION` (default `us-central1`), the Firestore
location, the Storage bucket, and the App Hosting/Cloud Run region. For KZ users a closer region
(e.g. `europe-west1`) reduces latency; Firestore location is permanent once chosen.

## Cost posture
- Min instances **0** (scale to zero) on both App Hosting and Cloud Run.
- Firestore + Storage on Blaze are pay-as-you-go; usage at student scale is small.
- No Firebase Analytics (internal Firestore analytics instead) to avoid added cost/latency.

See `DEPLOYMENT.md` for the actual deploy commands and `SECRETS_SETUP.md` for secret creation.
