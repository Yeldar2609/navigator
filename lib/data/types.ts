import type { Locale } from '@/lib/i18n/config'
import type { CareerRecommendation } from '@/lib/methodology/recommendations'
import type { ScoredResult } from '@/lib/methodology/scoring'
import type { PlanCategory } from '@/lib/methodology/plan-templates'
import type { SupportPreference } from '@/lib/methodology/scoring-config'

export interface StoredProfile {
  displayName: string
  gradeChoice: string // '8' | '9' | '10' | '11' | 'other'
  gradeLevel: number | null // numeric grade, null for "other"
  preferredLanguage: Locale
  schoolCode?: string
  favoriteSubjects: string[]
  currentGoals: string[]
  careerConfidence: number // 1..5
  supportPreference: SupportPreference
  freeTextGoal?: string
  onboardingCompleted: boolean
}

export interface StoredResult {
  resultId: string
  createdAt: string
  score: ScoredResult
  recommendations: CareerRecommendation[]
}

export type PlanItemStatus = 'todo' | 'in_progress' | 'done' | 'skipped'

export interface StoredPlanItem {
  id: string
  monthIndex: number
  weekIndex: number
  category: PlanCategory
  title: string
  description?: string
  status: PlanItemStatus
}

export interface StoredPlanMonth {
  monthIndex: number
  theme: string
  goal: string
  reflectionPrompt: string
  successMetric: string
}

export interface StoredPlan {
  id: string
  resultId: string
  horizonMonths: number
  routeModifier?: string
  months: StoredPlanMonth[]
  items: StoredPlanItem[]
  createdAt: string
}

export interface StoredCheckIn {
  id: string
  createdAt: string
  mood: number // 1..5
  confidence: number // 1..5
  effort: number // 1..5
  blocker?: string
  note?: string
}

export interface StoredChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  suggestedActions?: { kind: string; label: string }[]
  referencedFactors?: string[]
  safetyNotice?: string
}

export interface StoredChatThread {
  id: string
  createdAt: string
  messages: StoredChatMessage[]
}

export interface DemoUser {
  id: string
  email: string
}
