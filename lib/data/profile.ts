import { demoStore } from '@/lib/demo/store'
import type { OnboardingContext } from '@/lib/methodology/scoring-config'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser'
import { isDemoMode } from './mode'
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
 * Persist the onboarding profile. Demo mode → local store. Configured →
 * upsert into Supabase `profiles` (and mirror locally so the client flow has
 * immediate access to onboarding context for scoring).
 */
export async function saveProfile(profile: StoredProfile): Promise<boolean> {
  const saved = demoStore.setProfile(profile)
  if (isDemoMode() || !isSupabaseConfigured()) return saved

  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    const authId = data.user?.id
    if (!authId) return saved
    await supabase.from('profiles').upsert(
      {
        auth_user_id: authId,
        display_name: profile.displayName,
        grade_level: profile.gradeLevel,
        preferred_language: profile.preferredLanguage,
        school_code: profile.schoolCode ?? null,
        onboarding_completed: true,
        favorite_subjects: profile.favoriteSubjects,
        current_goals: profile.currentGoals,
        career_confidence: profile.careerConfidence,
        support_preference: profile.supportPreference,
        free_text_goal: profile.freeTextGoal ?? null,
      },
      { onConflict: 'auth_user_id' },
    )
  } catch {
    /* network/RLS issue — local store still holds the profile for the demo */
  }
  return saved
}
