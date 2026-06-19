import { z } from 'zod'

export const generatePlanSchema = z.object({
  resultId: z.string().uuid(),
  horizonMonths: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(6)]),
})

export const updatePlanItemSchema = z.object({
  planItemId: z.string().uuid(),
  status: z.enum(['todo', 'in_progress', 'done', 'skipped']).optional(),
  completionPercent: z.number().int().min(0).max(100).optional(),
})

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>
export type UpdatePlanItemInput = z.infer<typeof updatePlanItemSchema>
