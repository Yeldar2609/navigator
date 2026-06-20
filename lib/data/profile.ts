import { demoStore } from '@/lib/demo/store'
import type { OnboardingContext } from '@/lib/methodology/scoring-config'
import { getCurrentUid } from '@/lib/firebase/client'
import { fsSaveProfile } from '@/lib/firebase/firestore-client'
import { isFirebaseMode } from './mode'
import type { StoredProfile } from './types'

/** Client-side read of the current profile (local store is the UI source). */
export function getProfile(): StoredProfile | null {
  return demoStore.getProfile()
}

/** Onboarding context fed into IPO v1 + recommendations. */
export function onboardingContext(): OnboardingContext {
  const p = getProfile()
  return {
    careerConfidence: p?.careerConfidence,
    supportPreference: p?.supportPreference,
    favoriteSubjects: p?.favoriteSubjects,
    currentGoals: p?.currentGoals,
  }
}

/**
 * Persist the onboarding profile. Local store is always the immediate UI source.
 * In Firebase mode it also mirrors to Firestore under users/{uid} (best-effort).
 */
export async function saveProfile(profile: StoredProfile): Promise<boolean> {
  const saved = demoStore.setProfile(profile)
  if (!isFirebaseMode()) return saved
  const uid = getCurrentUid()
  if (!uid) return saved
  try {
    await fsSaveProfile(uid, profile)
  } catch {
    /* best-effort — local store still holds the profile */
  }
  return saved
}
