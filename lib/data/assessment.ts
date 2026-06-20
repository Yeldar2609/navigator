import { ASSESSMENT_ITEMS } from '@/lib/methodology/assessment-items'
import { recommendCareers } from '@/lib/methodology/recommendations'
import { scoreAssessment } from '@/lib/methodology/scoring'
import { demoStore } from '@/lib/demo/store'
import { getCurrentUid } from '@/lib/firebase/client'
import { fsAddResult, fsSaveAnswer } from '@/lib/firebase/firestore-client'
import { isDemoMode, isFirebaseMode } from './mode'
import { getProfile, onboardingContext } from './profile'
import type { StoredResult } from './types'

export const TOTAL_QUESTIONS = ASSESSMENT_ITEMS.length

export function getQuestions() {
  return ASSESSMENT_ITEMS // local methodology config — works with or without Supabase
}

export function getSessionId(): string {
  return demoStore.ensureSession()
}

export function getSavedAnswers(): Record<string, number> {
  return demoStore.getAnswers()
}

export async function saveAnswer(
  code: string,
  value: number,
): Promise<{ answeredCount: number; total: number }> {
  const { answeredCount } = demoStore.saveAnswer(code, value)
  if (isFirebaseMode()) {
    // Best-effort Firestore sync; local store remains the UI source of truth.
    const uid = getCurrentUid()
    if (uid) {
      try {
        await fsSaveAnswer(uid, demoStore.ensureSession(), code, value)
      } catch {
        /* ignore */
      }
    }
  }
  return { answeredCount, total: TOTAL_QUESTIONS }
}

/**
 * Score the assessment. Computes deterministically on the client (instant
 * results), persists locally, and (when configured) fires the server submit so
 * the authoritative row lands in Supabase. Both paths run the same engine.
 */
export async function submitAssessment(): Promise<StoredResult> {
  const answers = demoStore.getAnswers()
  const ctx = onboardingContext()
  const score = scoreAssessment(answers, { onboarding: ctx, planGenerated: false })
  const recommendations = recommendCareers({
    primaryRoute: score.primaryRoute,
    primaryCluster: score.primaryCluster,
    secondaryCluster: score.secondaryCluster,
    favoriteSubjects: ctx.favoriteSubjects,
    currentGoals: ctx.currentGoals,
    gradeLevel: getProfile()?.gradeLevel ?? null,
  })
  const result: StoredResult = {
    resultId: demoStore.newId(),
    createdAt: new Date().toISOString(),
    score,
    recommendations,
  }
  demoStore.addResult(result)

  if (isFirebaseMode()) {
    const uid = getCurrentUid()
    if (uid) {
      try {
        await fsAddResult(uid, result)
      } catch {
        /* ignore — client result already shown */
      }
    }
  }
  return result
}

export function getLatestResult(): StoredResult | null {
  return demoStore.getResult()
}

/** All assessment attempts, oldest → newest (drives history + comparison). */
export function getResultHistory(): StoredResult[] {
  return demoStore.getResultHistory()
}

/**
 * Begin a retake: clear the current session answers so the assessment starts
 * fresh. The previous result stays in history for comparison after resubmit.
 */
export function retakeAssessment(): void {
  demoStore.resetSession()
  if (!isDemoMode()) {
    fetch('/api/assessment/start', { method: 'POST' }).catch(() => {
      /* best-effort server session start */
    })
  }
}

export function isAssessmentComplete(): boolean {
  return Object.keys(demoStore.getAnswers()).length >= TOTAL_QUESTIONS
}
