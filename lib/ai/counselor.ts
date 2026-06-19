import type { Messages } from '@/lib/i18n/dictionaries'
import { interpolate } from '@/lib/utils/format'
import { classifyMessage } from './safety'
import type { StudentSnapshot } from './snapshot'

export type ChatActionKind = 'explore_careers' | 'build_plan' | 'open_plan' | 'view_results' | 'start_assessment'

export interface ChatAction {
  kind: ChatActionKind
  label: string
}

export interface CounselorReply {
  text: string
  intent: string
  suggestedQuestions: string[]
  suggestedActions: ChatAction[]
  referencedFactors: string[]
  safetyNotice?: string
}

/** Localized display values precomputed from the result/plan (built in the data layer). */
export interface CounselorFactors {
  routeTitle: string
  clusterTitle: string
  scorePct: number | null
  strengthLabel: string
  careersList: string
  skillsList: string
  subjectsList: string
  nextAction: string
}

type Intent =
  | 'explain_result'
  | 'why_route'
  | 'which_careers'
  | 'missing_skills'
  | 'make_plan'
  | 'this_month'
  | 'this_week'
  | 'talk_to_parents'
  | 'subjects'
  | 'plan_missed'
  | 'plan_easier'
  | 'plan_harder'
  | 'anxiety'
  | 'needs_verification'
  | 'greeting'
  | 'default'

// Ordered most-specific → most-general. Each intent has en/ru/kk hint substrings.
const INTENT_PATTERNS: { intent: Intent; hints: string[] }[] = [
  { intent: 'needs_verification', hints: ['university', 'universit', 'admission', 'salary', 'requirement', 'универси', 'зарплат', 'требован', 'универ', 'жалақы', 'талап'] },
  { intent: 'talk_to_parents', hints: ['parent', 'mom', 'dad', 'родител', 'маме', 'папе', 'ата-ан', 'ата ан', 'ата-ана'] },
  { intent: 'plan_missed', hints: ['missed', 'skipped', 'behind', 'пропуст', 'отстал', 'өткізіп', 'үлгер'] },
  { intent: 'plan_easier', hints: ['easier', 'too hard', 'lighter', 'легче', 'проще', 'жеңіл'] },
  { intent: 'plan_harder', hints: ['ambitious', 'harder', 'more challenge', 'амбициозн', 'сложнее', 'күрделі', 'қиынырақ'] },
  { intent: 'this_week', hints: ['this week', 'week', 'неделю', 'недел', 'апта', 'осы апта'] },
  { intent: 'make_plan', hints: ['plan', '3-month', '3 month', 'three month', 'месяц', 'план', 'жоспар', 'айлық'] },
  { intent: 'missing_skills', hints: ['skill', 'missing', 'learn', 'навык', 'дағды', 'үйрен'] },
  { intent: 'which_careers', hints: ['career', 'profession', 'job', 'explore', 'профес', 'карьер', 'мамандық', 'жұмыс'] },
  { intent: 'why_route', hints: ['why', 'route', 'direction', 'почему', 'направлен', 'неге', 'бағыт'] },
  { intent: 'explain_result', hints: ['explain', 'result', 'simple', 'mean', 'объясн', 'результат', 'просты', 'түсіндір', 'нәтиже', 'нені біл'] },
  { intent: 'subjects', hints: ['subject', 'предмет', 'пән', 'сабақ'] },
  { intent: 'anxiety', hints: ["don't know", 'do not know', 'unsure', 'not sure', 'scared', 'anxious', 'worried', 'pressure', 'не знаю', 'не уверен', 'боюсь', 'білмеймін', 'қорқам', 'сенімді емес'] },
  { intent: 'greeting', hints: ['hi', 'hello', 'hey', 'привет', 'здравствуй', 'сәлем', 'салем'] },
]

const NEEDS_RESULT: Intent[] = [
  'explain_result',
  'why_route',
  'which_careers',
  'missing_skills',
  'make_plan',
  'this_month',
  'this_week',
  'subjects',
]

function detectIntent(message: string): Intent {
  const text = message.toLowerCase()
  for (const { intent, hints } of INTENT_PATTERNS) {
    if (hints.some((h) => text.includes(h))) return intent
  }
  return 'default'
}

function actionLabels(d4: Messages['d4']): Record<ChatActionKind, string> {
  return {
    explore_careers: d4.chat.actionExplore,
    build_plan: d4.chat.actionPlan,
    open_plan: d4.chat.actionUpdatePlan,
    view_results: d4.chat.actionResults,
    start_assessment: d4.chat.actionAssessment,
  }
}

function actionsFor(intent: Intent, snapshot: StudentSnapshot, d4: Messages['d4']): ChatAction[] {
  const L = actionLabels(d4)
  const has = (k: ChatActionKind): ChatAction => ({ kind: k, label: L[k] })
  if (!snapshot.hasResult) return [has('start_assessment')]
  const hasPlan = !!snapshot.activePlan
  switch (intent) {
    case 'which_careers':
      return [has('explore_careers'), has('view_results')]
    case 'make_plan':
    case 'this_month':
      return hasPlan ? [has('open_plan')] : [has('build_plan')]
    case 'this_week':
    case 'plan_missed':
    case 'plan_easier':
    case 'plan_harder':
      return hasPlan ? [has('open_plan')] : [has('build_plan')]
    case 'explain_result':
    case 'why_route':
      return [has('view_results'), has('explore_careers')]
    default:
      return [has('view_results'), has('explore_careers')]
  }
}

function questionsFor(snapshot: StudentSnapshot, d4: Messages['d4']): string[] {
  const p = d4.prompts
  if (!snapshot.hasResult) return [p.beforeWhatHelp, p.beforeStart, p.beforeUnsure]
  if (snapshot.activePlan) return [p.planWeek, p.planEasier, p.afterParents]
  return [p.afterCareers, p.afterSkills, p.afterPlan3]
}

/** Default follow-up suggestions for the real-LLM path (which supplies its own text). */
export function baseSuggestions(
  snapshot: StudentSnapshot,
  d4: Messages['d4'],
): { questions: string[]; actions: ChatAction[] } {
  return { questions: questionsFor(snapshot, d4), actions: actionsFor('default', snapshot, d4) }
}

/**
 * Deterministic, profile-aware counselor used in demo mode (and as a no-key
 * server fallback). It never invents official facts, always stays supportive,
 * and short-circuits safely on crisis/harm. The real LLM (when a key is set)
 * uses the same system prompt + snapshot; this guarantees the demo is coherent.
 */
export function generateCounselorReply(input: {
  message: string
  snapshot: StudentSnapshot
  factors: CounselorFactors
  d4: Messages['d4']
  displayName?: string
}): CounselorReply {
  const { message, snapshot, factors, d4, displayName } = input
  const safety = classifyMessage(message)
  if (safety.category === 'crisis') {
    return {
      text: d4.safety.crisis,
      intent: 'crisis',
      suggestedQuestions: [],
      suggestedActions: [],
      referencedFactors: [],
      safetyNotice: d4.safety.notice,
    }
  }
  if (safety.category === 'harmful') {
    return {
      text: d4.safety.refuse,
      intent: 'harmful',
      suggestedQuestions: questionsFor(snapshot, d4),
      suggestedActions: [],
      referencedFactors: [],
    }
  }

  let intent = detectIntent(message)
  if (NEEDS_RESULT.includes(intent) && !snapshot.hasResult) {
    return {
      text: d4.counselor.noResult,
      intent: 'no_result',
      suggestedQuestions: questionsFor(snapshot, d4),
      suggestedActions: [{ kind: 'start_assessment', label: d4.chat.actionAssessment }],
      referencedFactors: [],
    }
  }
  if (intent === 'this_month' && message.toLowerCase().includes('week')) intent = 'this_week'

  const c = d4.counselor
  const vars = {
    name: displayName ?? '',
    route: factors.routeTitle,
    cluster: factors.clusterTitle,
    score: factors.scorePct ?? 0,
    strength: factors.strengthLabel,
    careers: factors.careersList,
    skills: factors.skillsList,
    subjects: factors.subjectsList,
    action: factors.nextAction,
  }

  const TEMPLATES: Record<Intent, string> = {
    explain_result: c.explainResult,
    why_route: c.whyRoute,
    which_careers: c.whichCareers,
    missing_skills: c.missingSkills,
    make_plan: c.makePlan,
    this_month: c.thisMonth,
    this_week: c.thisWeek,
    talk_to_parents: c.talkToParents,
    subjects: c.subjects,
    plan_missed: c.planMissed,
    plan_easier: c.planEasier,
    plan_harder: c.planHarder,
    anxiety: c.anxiety,
    needs_verification: c.needsVerification,
    greeting: snapshot.hasResult ? c.greeting : c.noResult,
    default: snapshot.hasResult ? c.default : c.noResult,
  }

  const referencedFactors: string[] = []
  if (snapshot.primaryRoute) referencedFactors.push(factors.routeTitle)
  if (snapshot.primaryCluster) referencedFactors.push(factors.clusterTitle)
  if (snapshot.scorePct != null) {
    referencedFactors.push(interpolate(d4.chat.factorScore, { score: snapshot.scorePct }))
  }

  return {
    text: interpolate(TEMPLATES[intent], vars),
    intent,
    suggestedQuestions: questionsFor(snapshot, d4),
    suggestedActions: actionsFor(intent, snapshot, d4),
    referencedFactors,
  }
}
