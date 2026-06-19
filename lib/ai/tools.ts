import type { Locale } from '@/lib/i18n/config'
import type { ChatActionKind } from './counselor'

// Maps a counselor action card to an in-app destination. Keeps the UI dumb:
// the AI suggests an action kind, this resolves where it goes.
const ROUTE_BY_ACTION: Record<ChatActionKind, string> = {
  explore_careers: 'career-explorer',
  build_plan: 'results',
  open_plan: 'plan',
  view_results: 'results',
  start_assessment: 'assessment',
}

export function actionHref(kind: ChatActionKind, locale: Locale): string {
  return `/${locale}/${ROUTE_BY_ACTION[kind]}`
}
