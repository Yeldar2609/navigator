# Rollback — Kim Bolam

Three independently versioned surfaces can be rolled back: the **App Hosting** app (public), the
**Cloud Run** service (private alternate), and the **security rules**. Roll back only what changed.

## 1. App Hosting (primary, public)
Backend `kimbolam`, region `europe-west4`, repo `Yeldar2609/navigator`, branch
`worktree-day-6-build`.

**Option A — roll back to a previous rollout (fastest):**
Firebase console → App Hosting → backend `kimbolam` → **Rollouts** → pick the last known-good
rollout → roll back / re-promote it. Traffic shifts to that build.

**Option B — redeploy a previous commit (git is the source of truth):**
Because rollouts are automatic on push, revert the offending change and push:
```bash
git revert <bad-commit>        # or: git reset --hard <good-commit> on the live branch
git push origin worktree-day-6-build
```
A new rollout builds from that commit. (Avoid force-push unless necessary.)

**Option C — re-create a rollout for the current/last commit without code change:**
```bash
firebase apphosting:rollouts:create kimbolam
```

Verify after rollback: `GET /api/health` 200, `GET /api/version` shows the expected build,
`/ru` `/kk` `/en` 200.

## 2. Cloud Run (alternate, private)
Service `kim-bolam`, region `europe-west1`.

Shift traffic back to a previous, known-good revision:
```bash
gcloud run revisions list --service kim-bolam --region europe-west1
gcloud run services update-traffic kim-bolam \
  --region europe-west1 \
  --to-revisions <PREVIOUS_REVISION>=100
```
(To split during validation, use e.g. `<PREVIOUS>=90,<CURRENT>=10`.)

## 3. Security rules (Firestore / Storage)
Rules are deployed from the files in git. To roll back, restore the previous version from history
and redeploy:
```bash
git checkout <good-commit> -- firestore.rules storage.rules firestore.indexes.json
firebase deploy --only firestore:rules,firestore:indexes,storage
```
Then restore your working tree (`git checkout HEAD -- firestore.rules ...`) once verified.

## Notes
- Data (Firestore documents, Storage objects) is **not** rolled back by any of the above — these
  roll back **code and rules only**. Treat data migrations separately.
- Firestore/Storage **location** (europe-west1) is permanent and unaffected by rollback.
