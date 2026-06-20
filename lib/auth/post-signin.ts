import { isFirebaseMode } from '@/lib/data/mode'
import { getCurrentUid } from '@/lib/firebase/client'
import { fsGetLatestResult, fsGetProfile } from '@/lib/firebase/firestore-client'
import { demoStore } from '@/lib/demo/store'

/**
 * Decide where to send a user immediately after a successful sign-in / sign-up.
 *
 * This is AWAITED before navigating (unlike the AuthProvider's fire-and-forget
 * hydration) so it never races the redirect — the previous bug was that a
 * returning user was always pushed to /onboarding and the assessment page then
 * read an empty local cache, re-prompting them to take the test.
 *
 * Routing (per the Day-7 spec):
 *   - no profile yet          → onboarding
 *   - onboarded, no result    → assessment
 *   - has an assessment result → dashboard
 *
 * It also hydrates the local demoStore from Firestore so the destination page
 * (which reads demoStore) reflects the user's persisted profile + latest result.
 */
export async function resolvePostAuthPath(locale: string): Promise<string> {
  let onboarded = false
  let hasResult = false

  if (isFirebaseMode()) {
    const uid = getCurrentUid()
    if (uid) {
      try {
        const [profile, latest] = await Promise.all([
          fsGetProfile(uid),
          fsGetLatestResult(uid),
        ])
        if (profile) {
          onboarded = true
          demoStore.setProfile(profile)
        }
        if (latest) {
          hasResult = true
          const cached = demoStore.getResultHistory()
          if (!cached.some((r) => r.resultId === latest.resultId)) {
            demoStore.addResult(latest)
          }
        }
      } catch {
        /* read failed — fall back to the onboarding default below */
      }
    }
  } else {
    // Demo/preview: local store is the source of truth.
    onboarded = Boolean(demoStore.getProfile())
    hasResult = Boolean(demoStore.getResult())
  }

  if (hasResult) return `/${locale}/dashboard`
  if (onboarded) return `/${locale}/assessment`
  return `/${locale}/onboarding`
}
