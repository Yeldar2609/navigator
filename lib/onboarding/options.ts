// Onboarding option key lists. Labels resolve via lib/methodology/tag-labels.ts.

export const SUBJECT_KEYS = [
  'mathematics',
  'informatics',
  'biology',
  'chemistry',
  'physics',
  'languages',
  'literature',
  'history',
  'geography',
  'art_design',
  'social_science',
  'business_economics',
] as const

export const GOAL_KEYS = [
  'understand_myself',
  'choose_major',
  'choose_university',
  'find_career_direction',
  'improve_skills',
  'make_parent_conversation_easier',
  'build_monthly_plan',
] as const

export const SUPPORT_KEYS = ['simple_guidance', 'detailed_guidance', 'ai_counselor'] as const

export const GRADE_CHOICES = ['8', '9', '10', '11', 'other'] as const
