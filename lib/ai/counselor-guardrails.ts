import type { Locale } from '@/lib/i18n/config'

/**
 * Scope guardrails for the Kim Bolam AI Counselor. Runs BEFORE any model call so
 * out-of-scope requests are refused/redirected deterministically — independent of
 * the model and even when the AI agent is unconfigured. Crisis/harm is handled
 * separately by lib/ai/safety.ts (which takes precedence).
 */

export type OutOfScopeReason =
  | 'coding'
  | 'math_homework'
  | 'homework'
  | 'medical'
  | 'therapy'
  | 'sensitive_data'
  | 'unrelated'

export interface ScopeResult {
  allowed: boolean
  reason?: OutOfScopeReason
  /** Localized message to show when not allowed. */
  redirect?: string
}

// Substring hints across en/ru/kk. Deliberately conservative — career/education
// phrasing must never trip these (e.g. "computer science career" is allowed).
const PATTERNS: { reason: OutOfScopeReason; hints: string[] }[] = [
  {
    reason: 'coding',
    hints: [
      'write code', 'debug', 'fix my code', 'write a function', 'write a program',
      'solve this code', 'напиши код', 'исправь код', 'отладь', 'код на python',
      'кодты жаз', 'бағдарлама жаз',
    ],
  },
  {
    reason: 'math_homework',
    hints: [
      'solve this equation', 'solve for x', 'do my math', 'integral of', 'derivative of',
      'реши уравнение', 'реши задачу по математике', 'посчитай интеграл',
      'теңдеуді шеш', 'математика есебін шеш',
    ],
  },
  {
    reason: 'homework',
    hints: [
      'do my homework', 'write my essay', 'write an essay for me', 'answer my test',
      'сделай домашку', 'напиши сочинение', 'реши домашнее задание',
      'үй жұмысын істе', 'эссе жаз',
    ],
  },
  {
    reason: 'medical',
    hints: [
      'diagnose', 'what disease', 'are my symptoms', 'should i take medicine',
      'поставь диагноз', 'какие симптомы', 'какое лекарство',
      'диагноз қой', 'қандай дәрі',
    ],
  },
  {
    reason: 'therapy',
    hints: [
      'be my therapist', 'therapy session', 'diagnose my depression',
      'будь моим психологом', 'проведи терапию', 'диагностируй депрессию',
      'терапия жаса',
    ],
  },
  {
    reason: 'sensitive_data',
    hints: [
      'my passport number', 'my national id', 'my home address', 'my iin', 'my card number',
      'номер паспорта', 'мой иин', 'мой домашний адрес', 'номер карты',
      'жеке куәлік нөмірі', 'үй мекенжайым',
    ],
  },
]

const REDIRECT: Record<Locale, Record<OutOfScopeReason, string>> = {
  ru: {
    coding: 'Я помогаю с выбором профессии и учебным планом, а не с написанием кода. Хотите разобрать, какие навыки программирования стоит развивать под вашу цель?',
    math_homework: 'Я не решаю домашние задания, но помогу понять, какие предметы и навыки важны для вашего направления. С чего начнём?',
    homework: 'С домашними заданиями я не помогаю. Зато могу помочь с профессиями, предметами и планом развития. О чём поговорим?',
    medical: 'Это вопрос к врачу — я не даю медицинских советов. Давайте лучше обсудим ваш путь к профессии.',
    therapy: 'Я не психолог и не провожу терапию. Если тяжело, поговорите с близким взрослым. А с выбором направления и планом я рядом и готов помочь.',
    sensitive_data: 'Пожалуйста, не делитесь личными документами или конфиденциальными данными в чате. Давайте сосредоточимся на вашем учебном и карьерном плане.',
    unrelated: 'Я — счётчик по профориентации Kim Bolam: помогаю с профессиями, предметами и планами. Чем помочь в этом?',
  },
  kk: {
    coding: 'Мен кәсіп таңдау мен оқу жоспарына көмектесемін, код жазбаймын. Мақсатыңызға қандай бағдарламалау дағдылары қажет екенін талдайық па?',
    math_homework: 'Мен үй жұмысын шешпеймін, бірақ бағытыңызға қай пәндер мен дағдылар маңызды екенін түсінуге көмектесемін. Неден бастаймыз?',
    homework: 'Үй жұмысына көмектеспеймін. Бірақ кәсіптер, пәндер және даму жоспары бойынша көмектесе аламын. Не туралы сөйлесеміз?',
    medical: 'Бұл дәрігерге қойылатын сұрақ — мен медициналық кеңес бермеймін. Кәсіп жолыңызды талқылайық.',
    therapy: 'Мен психолог емеспін және терапия жүргізбеймін. Қиын болса, жақын үлкенмен сөйлесіңіз. Ал бағыт пен жоспарға көмектесуге дайынмын.',
    sensitive_data: 'Өтінемін, чатта жеке құжаттарды немесе құпия деректерді бөліспеңіз. Оқу мен мансап жоспарыңызға тоқталайық.',
    unrelated: 'Мен — Kim Bolam профбағдар көмекшісімін: кәсіптер, пәндер және жоспарлармен көмектесемін. Осы бойынша немен көмектесейін?',
  },
  en: {
    coding: 'I help with career direction and your study plan, not with writing code. Want to look at which programming skills fit your goal?',
    math_homework: "I don't solve homework, but I can help you see which subjects and skills matter for your direction. Where shall we start?",
    homework: "I can't do homework. I can help with careers, subjects, and a growth plan though — what would you like to explore?",
    medical: "That's a question for a doctor — I don't give medical advice. Let's talk about your path toward a career instead.",
    therapy: "I'm not a therapist and I don't do therapy. If things feel heavy, please talk to a trusted adult. I'm here for direction and planning.",
    sensitive_data: "Please don't share personal documents or sensitive information in chat. Let's focus on your study and career plan.",
    unrelated: "I'm the Kim Bolam career guide — I help with careers, subjects, and plans. How can I help with that?",
  },
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Check whether a message is in scope. Returns a localized redirect when not. */
export function checkScope(message: string, locale: Locale): ScopeResult {
  const text = normalize(message)
  for (const { reason, hints } of PATTERNS) {
    if (hints.some((h) => text.includes(h))) {
      return { allowed: false, reason, redirect: REDIRECT[locale][reason] }
    }
  }
  return { allowed: true }
}

/** The subtle privacy hint shown near the chat input. */
export const PRIVACY_INPUT_HINT: Record<Locale, string> = {
  ru: 'Не делитесь личными документами или конфиденциальной информацией в чате.',
  kk: 'Чатта жеке құжаттарды немесе құпия ақпаратты бөліспеңіз.',
  en: 'Do not share personal documents or sensitive information in chat.',
}
