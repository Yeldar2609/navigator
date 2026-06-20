# Demo / Walkthrough Script — Kim Bolam

A short, repeatable script for demoing the **live** app. ~5 minutes.

**Live URL:** https://kimbolam--kim-bolam.europe-west4.hosted.app

## Setup (before the audience)
- Have a throwaway email ready (or use Google sign-in).
- Optional: open `GET /api/version` in a tab to show
  `{ env: production, backend: firebase, aiCounselor: disabled }` — proves it is real production on
  Firebase, AI safely off.

## Script

1. **Open the landing page (`/ru`).**
   - "This is live in production, in Russian by default. Same app at `/kk` (Kazakh) and `/en`
     (English)." Switch the language to show all three load.
   - Point out the single clear call-to-action.

2. **Take the test (no account yet).**
   - Start the assessment as an anonymous visitor — the preview tier works without signing in.
   - Walk through a few items: the age slider, the 1–5 scale, the deterministic adaptive flow.

3. **Sign up to save results.**
   - At results, prompt to sign in to persist. Sign up with email/password (or Google).
   - "This created a real Firebase account; onboarding just wrote my profile to Firestore, and the
     rules guarantee only I can read it."

4. **See results + plan.**
   - Show the student-facing 0–100 score with encouraging labels (and mention the internal 0–60
     methodology score visible in report detail).
   - Generate a plan; mark one item complete to show progress.

5. **Check-in.**
   - Do a weekly/monthly check-in; note the calm, non-confetti celebration.

6. **AI counselor — note the safe-disabled state.**
   - Open the counselor. "The AI guidance is intentionally **disabled** at launch — no agent is
     wired yet. It still runs safety and scope guardrails and shows a template fallback; it never
     pretends to be a real AI. The privacy hint reminds students not to share sensitive info."

## Closing talking points
- Public via Firebase App Hosting; Cloud Run exists as a private backup (org policy blocks making
  Cloud Run public).
- No secrets shipped; admin uses Application Default Credentials, not a key file.
- Not indexed yet (noindex) — deliberate until the team is ready.
- Honest about limits: curated data, productized (not yet validated) methodology, AI is guidance —
  not a human counselor, therapist, or admissions authority. See `KNOWN_LIMITATIONS.md`.
