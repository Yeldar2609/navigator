import type { Locale } from '@/lib/i18n/config'
import {
  generatePlan as buildPlanTemplate,
  type PlanHorizon,
} from '@/lib/methodology/plan-templates'
import { recommendCareers } from '@/lib/methodology/recommendations'
import type { Route } from '@/lib/methodology/routes'
import { scoreAssessment } from '@/lib/methodology/scoring'
import { demoStore } from '@/lib/demo/store'
import { getCurrentUid } from '@/lib/firebase/client'
import { fsSavePlan, fsUpdatePlanItems } from '@/lib/firebase/firestore-client'
import { isFirebaseMode } from './mode'
import { getProfile, onboardingContext } from './profile'
import type { PlanItemStatus, StoredPlan, StoredPlanItem, StoredPlanMonth } from './types'

/**
 * Generate a plan for a result's route at the chosen horizon (1/2/3/6 months).
 * Re-scores the stored result with planGenerated:true (the readiness score rises
 * once a plan exists). Demo mode persists locally; configured mode also fires the
 * server route.
 */
export async function generatePlan(opts: {
  resultId: string
  route: Route
  routeModifier?: string
  horizonMonths: PlanHorizon
  locale: Locale
  routeTitle: string
}): Promise<StoredPlan> {
  const generated = buildPlanTemplate(opts.route, opts.horizonMonths, opts.locale, opts.routeTitle)

  const months: StoredPlanMonth[] = generated.months.map((m) => ({
    monthIndex: m.monthIndex,
    theme: m.theme,
    goal: m.goal,
    reflectionPrompt: m.reflectionPrompt,
    successMetric: m.successMetric,
  }))
  // Preserve progress across horizon changes: HORIZON_SEQUENCE is a prefix chain,
  // so shared months produce identical items — carry over their id + status.
  const prev = new Map<string, StoredPlanItem>()
  const existingPlan = demoStore.getPlan()
  if (existingPlan) {
    for (const it of existingPlan.items) {
      prev.set(`${it.monthIndex}:${it.weekIndex}:${it.category}:${it.title}`, it)
    }
  }
  const items: StoredPlanItem[] = generated.months.flatMap((m) =>
    m.weeks.map((w) => {
      const match = prev.get(`${m.monthIndex}:${w.weekIndex}:${w.category}:${w.title}`)
      return {
        id: match?.id ?? demoStore.newId(),
        monthIndex: m.monthIndex,
        weekIndex: w.weekIndex,
        category: w.category,
        title: w.title,
        status: match?.status ?? ('todo' as PlanItemStatus),
      }
    }),
  )

  const plan: StoredPlan = {
    id: demoStore.newId(),
    resultId: opts.resultId,
    horizonMonths: opts.horizonMonths,
    routeModifier: opts.routeModifier,
    months,
    items,
    createdAt: new Date().toISOString(),
  }
  demoStore.setPlan(plan)

  // Re-score with planGenerated: true so the readiness score reflects the plan.
  const existing = demoStore.getResult()
  if (existing) {
    const ctx = onboardingContext()
    const answers = demoStore.getAnswers()
    const score = scoreAssessment(answers, { onboarding: ctx, planGenerated: true })
    const recommendations = recommendCareers({
      primaryRoute: score.primaryRoute,
      primaryCluster: score.primaryCluster,
      secondaryCluster: score.secondaryCluster,
      favoriteSubjects: ctx.favoriteSubjects,
      currentGoals: ctx.currentGoals,
      gradeLevel: getProfile()?.gradeLevel ?? null,
    })
    demoStore.setResult({ ...existing, score, recommendations })
  }

  if (isFirebaseMode()) {
    const uid = getCurrentUid()
    if (uid) {
      try {
        await fsSavePlan(uid, plan)
      } catch {
        /* ignore */
      }
    }
  }
  return plan
}

export function getPlan(): StoredPlan | null {
  return demoStore.getPlan()
}

export async function setPlanItemStatus(
  itemId: string,
  status: PlanItemStatus,
): Promise<StoredPlan | null> {
  const updated = demoStore.updatePlanItem(itemId, { status })
  if (isFirebaseMode()) {
    const uid = getCurrentUid()
    if (uid && updated?.id) {
      try {
        await fsUpdatePlanItems(uid, updated.id, updated.items)
      } catch {
        /* ignore */
      }
    }
  }
  return updated
}

export function planProgress(plan: StoredPlan): number {
  if (plan.items.length === 0) return 0
  const done = plan.items.filter((i) => i.status === 'done').length
  return Math.round((done / plan.items.length) * 100)
}

/** First not-done item across the plan (drives the "this week" card). */
export function nextPlanItem(plan: StoredPlan): StoredPlanItem | null {
  return plan.items.find((i) => i.status !== 'done') ?? null
}
