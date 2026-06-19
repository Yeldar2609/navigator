import { z } from 'zod'

export const startAssessmentSchema = z.object({
  templateVersion: z.string().default('v1'),
})

export const saveAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionCode: z.string().regex(/^Q([1-9]|[1-3]\d|40)$/, 'Invalid question code'),
  value: z.number().int().min(1).max(5),
})

export const submitAssessmentSchema = z.object({
  sessionId: z.string().uuid(),
})

export type StartAssessmentInput = z.infer<typeof startAssessmentSchema>
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>
