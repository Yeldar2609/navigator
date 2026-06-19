// Local, dependency-free safety classifier. Runs BEFORE any AI call (and works
// even when no moderation API is configured). The goal is not diagnosis — it is
// to catch crisis/harm signals so the counselor responds safely and stops
// coaching in that turn. Err toward safety; a false positive only surfaces a
// supportive message + the option to keep going.

export type SafetyCategory = 'crisis' | 'harmful' | 'ok'

export interface SafetyResult {
  category: SafetyCategory
  matched?: string
}

// Self-harm / suicide / abuse signals across en / ru / kk. Substring match on a
// normalized (lowercased) message. Phrases are chosen to minimize idiomatic
// false positives ("beats me", "dying to…") while still catching clear cases.
const CRISIS_PATTERNS: string[] = [
  // English — self-harm / suicide
  'kill myself',
  'killing myself',
  'suicide',
  'suicidal',
  'want to die',
  'wanna die',
  'i want to end my life',
  'end my life',
  'end it all',
  'no reason to live',
  "don't want to live",
  'do not want to live',
  'self-harm',
  'self harm',
  'hurt myself',
  'harm myself',
  'cut myself',
  'cutting myself',
  // English — abuse / unsafe at home
  'being abused',
  'i am abused',
  'someone hurts me at home',
  'hits me at home',
  // Russian
  'убить себя',
  'покончить с собой',
  'покончить с жизнью',
  'суицид',
  'не хочу жить',
  'хочу умереть',
  'причиняю себе боль',
  'режу себя',
  'нет смысла жить',
  // Kazakh
  'өзімді өлтір',
  'өмірімді қиям',
  'өлгім келеді',
  'өмір сүргім келмейді',
  'суицид',
  'өзіме зиян',
]

// Requests to cause serious harm to others / clearly illegal violence. Kept
// small and specific; career/study questions must never match.
const HARMFUL_PATTERNS: string[] = [
  'make a bomb',
  'build a bomb',
  'how to kill someone',
  'how to hurt someone',
  'how to make a weapon',
  'buy a gun illegally',
  'how to poison',
]

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

function firstMatch(text: string, patterns: string[]): string | undefined {
  for (const p of patterns) if (text.includes(p)) return p
  return undefined
}

/** Classify a user message. Crisis takes precedence over everything else. */
export function classifyMessage(message: string): SafetyResult {
  const text = normalize(message)
  const crisis = firstMatch(text, CRISIS_PATTERNS)
  if (crisis) return { category: 'crisis', matched: crisis }
  const harmful = firstMatch(text, HARMFUL_PATTERNS)
  if (harmful) return { category: 'harmful', matched: harmful }
  return { category: 'ok' }
}

export function isCrisis(message: string): boolean {
  return classifyMessage(message).category === 'crisis'
}
