import type { AwarenessLevel } from '@/lib/methodology/awareness-index'
import type { Route } from '@/lib/methodology/routes'

// DEMO/sample students so the admin dashboard is demoable with no backend. This
// is clearly-labelled preview data — real installs query Supabase (RLS-scoped to
// the admin's organization). Not real people.
export interface AdminStudent {
  id: string
  name: string
  grade: number
  assessmentCompleted: boolean
  route: Route | null
  primaryCluster: string | null
  awarenessLevel: AwarenessLevel | null
  readinessPct: number | null
  strengths: string[]
  growthAreas: string[]
  recommendedCareers: string[]
  planDone: number
  planTotal: number
  lastCheckInDaysAgo: number | null
  checkInCount: number
}

export const DEMO_STUDENTS: AdminStudent[] = [
  {
    id: 's1', name: 'Aru', grade: 9, assessmentCompleted: true, route: 'technological',
    primaryCluster: 'digital_innovator', awarenessLevel: 'high', readinessPct: 78,
    strengths: ['interests', 'competencies'], growthAreas: ['values'],
    recommendedCareers: ['software_developer', 'data_analyst'], planDone: 5, planTotal: 8,
    lastCheckInDaysAgo: 2, checkInCount: 4,
  },
  {
    id: 's2', name: 'Dias', grade: 10, assessmentCompleted: true, route: 'creative',
    primaryCluster: 'creator', awarenessLevel: 'medium', readinessPct: 54,
    strengths: ['strengths', 'interests'], growthAreas: ['competencies'],
    recommendedCareers: ['ux_ui_designer', 'graphic_designer'], planDone: 2, planTotal: 4,
    lastCheckInDaysAgo: 6, checkInCount: 2,
  },
  {
    id: 's3', name: 'Aizhan', grade: 11, assessmentCompleted: true, route: 'research',
    primaryCluster: 'researcher', awarenessLevel: 'high', readinessPct: 82,
    strengths: ['competencies', 'values'], growthAreas: ['strengths'],
    recommendedCareers: ['psychologist', 'biologist'], planDone: 9, planTotal: 12,
    lastCheckInDaysAgo: 1, checkInCount: 7,
  },
  {
    id: 's4', name: 'Nurlan', grade: 8, assessmentCompleted: false, route: null,
    primaryCluster: null, awarenessLevel: null, readinessPct: null,
    strengths: [], growthAreas: [], recommendedCareers: [], planDone: 0, planTotal: 0,
    lastCheckInDaysAgo: null, checkInCount: 0,
  },
  {
    id: 's5', name: 'Madina', grade: 10, assessmentCompleted: true, route: 'social_humanitarian',
    primaryCluster: 'social_leader', awarenessLevel: 'medium', readinessPct: 60,
    strengths: ['values', 'interests'], growthAreas: ['competencies'],
    recommendedCareers: ['teacher', 'social_worker'], planDone: 1, planTotal: 4,
    lastCheckInDaysAgo: 12, checkInCount: 1,
  },
  {
    id: 's6', name: 'Timur', grade: 9, assessmentCompleted: true, route: 'managerial',
    primaryCluster: 'strategist', awarenessLevel: 'low', readinessPct: 38,
    strengths: ['strengths'], growthAreas: ['values', 'competencies'],
    recommendedCareers: ['project_manager', 'entrepreneur'], planDone: 0, planTotal: 4,
    lastCheckInDaysAgo: 20, checkInCount: 1,
  },
  {
    id: 's7', name: 'Aigerim', grade: 11, assessmentCompleted: true, route: 'technological',
    primaryCluster: 'digital_innovator', awarenessLevel: 'medium', readinessPct: 66,
    strengths: ['competencies', 'interests'], growthAreas: ['values'],
    recommendedCareers: ['ai_specialist', 'cybersecurity_specialist'], planDone: 6, planTotal: 12,
    lastCheckInDaysAgo: 3, checkInCount: 5,
  },
  {
    id: 's8', name: 'Daniyar', grade: 10, assessmentCompleted: false, route: null,
    primaryCluster: null, awarenessLevel: null, readinessPct: null,
    strengths: [], growthAreas: [], recommendedCareers: [], planDone: 0, planTotal: 0,
    lastCheckInDaysAgo: null, checkInCount: 0,
  },
  {
    id: 's9', name: 'Saule', grade: 9, assessmentCompleted: true, route: 'creative',
    primaryCluster: 'creator', awarenessLevel: 'high', readinessPct: 74,
    strengths: ['interests', 'strengths'], growthAreas: ['competencies'],
    recommendedCareers: ['content_creator', 'marketing_specialist'], planDone: 3, planTotal: 4,
    lastCheckInDaysAgo: 4, checkInCount: 3,
  },
  {
    id: 's10', name: 'Yerlan', grade: 11, assessmentCompleted: true, route: 'research',
    primaryCluster: 'researcher', awarenessLevel: 'medium', readinessPct: 58,
    strengths: ['values', 'competencies'], growthAreas: ['interests'],
    recommendedCareers: ['medical_doctor', 'chemist'], planDone: 4, planTotal: 12,
    lastCheckInDaysAgo: 8, checkInCount: 2,
  },
  {
    id: 's11', name: 'Kamila', grade: 8, assessmentCompleted: true, route: 'social_humanitarian',
    primaryCluster: 'social_leader', awarenessLevel: 'low', readinessPct: 42,
    strengths: ['values'], growthAreas: ['strengths', 'interests'],
    recommendedCareers: ['teacher', 'translator'], planDone: 0, planTotal: 4,
    lastCheckInDaysAgo: null, checkInCount: 0,
  },
  {
    id: 's12', name: 'Arman', grade: 10, assessmentCompleted: true, route: 'managerial',
    primaryCluster: 'strategist', awarenessLevel: 'high', readinessPct: 80,
    strengths: ['competencies', 'strengths'], growthAreas: ['values'],
    recommendedCareers: ['business_analyst', 'financial_analyst'], planDone: 8, planTotal: 8,
    lastCheckInDaysAgo: 2, checkInCount: 6,
  },
]

/** A student flagged for a teacher's attention. */
export function needsSupport(s: AdminStudent): boolean {
  if (!s.assessmentCompleted) return true
  if (s.awarenessLevel === 'low') return true
  if (s.planTotal > 0 && s.planDone === 0) return true
  return false
}

export interface AdminSummary {
  total: number
  completed: number
  avgReadiness: number | null
  topRoute: Route | null
  needSupport: number
}

export function summarize(students: AdminStudent[]): AdminSummary {
  const completed = students.filter((s) => s.assessmentCompleted)
  const readiness = completed.map((s) => s.readinessPct ?? 0)
  const avgReadiness = readiness.length
    ? Math.round(readiness.reduce((a, b) => a + b, 0) / readiness.length)
    : null
  const routeCount = new Map<Route, number>()
  for (const s of completed) {
    if (s.route) routeCount.set(s.route, (routeCount.get(s.route) ?? 0) + 1)
  }
  let topRoute: Route | null = null
  let max = 0
  for (const [r, c] of routeCount) {
    if (c > max) {
      max = c
      topRoute = r
    }
  }
  return {
    total: students.length,
    completed: completed.length,
    avgReadiness,
    topRoute,
    needSupport: students.filter(needsSupport).length,
  }
}
