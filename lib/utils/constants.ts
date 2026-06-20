import { locales } from '@/lib/i18n/config'

export const APP_NAME = 'Kim Bolam'

export const PLAN_HORIZONS = [1, 2, 3, 6] as const
export type PlanHorizon = (typeof PLAN_HORIZONS)[number]

export const GRADES = [8, 9, 10, 11] as const
export type Grade = (typeof GRADES)[number]

export const DEMO_SCHOOL_CODE = 'DEMO-SCHOOL'

export const SUPPORTED_LOCALES = locales

// Student navigation. `key` indexes the `nav` dictionary section; `href` is the
// route segment appended after /<locale>/.
export const NAV_ITEMS = [
  { key: 'dashboard', href: 'dashboard' },
  { key: 'assessment', href: 'assessment' },
  { key: 'results', href: 'results' },
  { key: 'plan', href: 'plan' },
  { key: 'careers', href: 'career-explorer' },
  { key: 'chat', href: 'chat' },
  { key: 'checkIns', href: 'check-ins' },
] as const

export type NavItem = (typeof NAV_ITEMS)[number]
