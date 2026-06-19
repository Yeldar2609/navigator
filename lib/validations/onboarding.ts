import { z } from 'zod'
import { GRADES } from '@/lib/utils/constants'

// Locale enum kept literal here to satisfy z.enum's tuple requirement.
const localeEnum = z.enum(['kk', 'ru', 'en'])

export const onboardingSchema = z.object({
  displayName: z.string().min(1, 'Please tell us your name').max(80),
  gradeLevel: z.coerce
    .number()
    .int()
    .refine((g) => (GRADES as readonly number[]).includes(g), 'Pick your grade'),
  preferredLanguage: localeEnum,
  schoolCode: z.string().max(40).optional().or(z.literal('')),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
