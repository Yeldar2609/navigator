import { z } from 'zod'

// Structured AI plan output (matches /api/plan/generate's personalization path).
export const aiPlanActionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.enum(['explore', 'learn', 'practice', 'talk', 'reflect', 'decide']),
  estimated_time: z.string().optional(),
  success_metric: z.string().optional(),
})

export const aiPlanWeekSchema = z.object({
  week_index: z.number().int().min(1),
  title: z.string(),
  actions: z.array(aiPlanActionSchema).min(1),
  reflection_prompt: z.string().optional(),
})

export const aiPlanMonthSchema = z.object({
  month_index: z.number().int().min(1),
  theme: z.string(),
  goal: z.string(),
  encouragement: z.string().optional(),
  weeks: z.array(aiPlanWeekSchema).min(1),
})

export const aiPlanSchema = z.object({
  title: z.string(),
  horizon_months: z.number().int(),
  route: z.string(),
  student_friendly_summary: z.string(),
  months: z.array(aiPlanMonthSchema).min(1),
  check_in_schedule: z.string().optional(),
  next_reassessment_suggestion: z.string().optional(),
})

export type AiPlan = z.infer<typeof aiPlanSchema>

// Shape of the /api/chat response.
export const chatActionSchema = z.object({ kind: z.string(), label: z.string() })

export const chatResponseSchema = z.object({
  thread_id: z.string(),
  assistant_message: z.string(),
  suggested_questions: z.array(z.string()),
  suggested_actions: z.array(chatActionSchema),
  referenced_profile_factors: z.array(z.string()),
  safety_notice_optional: z.string().optional(),
})

export type ChatResponse = z.infer<typeof chatResponseSchema>
