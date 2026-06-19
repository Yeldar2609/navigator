import type { Locale } from '@/lib/i18n/config'

// Localized labels for the finite tag sets (subjects, student goals, support
// preferences, career skills). Kept here so the type-checked UI dictionary stays
// lean. TODO_TRANSLATION_REVIEW: kk strings need a native pass.

type LabelMap = Record<string, Record<Locale, string>>

export const SUBJECT_LABELS: LabelMap = {
  mathematics: { en: 'Mathematics', ru: 'Математика', kk: 'Математика' },
  informatics: { en: 'Informatics', ru: 'Информатика', kk: 'Информатика' },
  biology: { en: 'Biology', ru: 'Биология', kk: 'Биология' },
  chemistry: { en: 'Chemistry', ru: 'Химия', kk: 'Химия' },
  physics: { en: 'Physics', ru: 'Физика', kk: 'Физика' },
  languages: { en: 'Languages', ru: 'Языки', kk: 'Тілдер' },
  literature: { en: 'Literature', ru: 'Литература', kk: 'Әдебиет' },
  history: { en: 'History', ru: 'История', kk: 'Тарих' },
  geography: { en: 'Geography', ru: 'География', kk: 'География' },
  art_design: { en: 'Art & Design', ru: 'Искусство и дизайн', kk: 'Өнер және дизайн' },
  social_science: { en: 'Social Science', ru: 'Обществознание', kk: 'Қоғамтану' },
  business_economics: { en: 'Business & Economics', ru: 'Бизнес и экономика', kk: 'Бизнес және экономика' },
}

export const GOAL_LABELS: LabelMap = {
  understand_myself: { en: 'Understand myself', ru: 'Понять себя', kk: 'Өзімді түсіну' },
  choose_major: { en: 'Choose a major', ru: 'Выбрать специальность', kk: 'Мамандық таңдау' },
  choose_university: { en: 'Choose a university', ru: 'Выбрать университет', kk: 'Университет таңдау' },
  find_career_direction: { en: 'Find a direction', ru: 'Найти направление', kk: 'Бағыт табу' },
  improve_skills: { en: 'Improve my skills', ru: 'Развить навыки', kk: 'Дағдыларды дамыту' },
  make_parent_conversation_easier: {
    en: 'Talk to my parents',
    ru: 'Поговорить с родителями',
    kk: 'Ата-анаммен сөйлесу',
  },
  build_monthly_plan: { en: 'Build a plan', ru: 'Составить план', kk: 'Жоспар құру' },
}

export const SUPPORT_LABELS: LabelMap = {
  simple_guidance: { en: 'Simple guidance', ru: 'Простые подсказки', kk: 'Қарапайым кеңес' },
  detailed_guidance: { en: 'Detailed guidance', ru: 'Подробные подсказки', kk: 'Толық кеңес' },
  ai_counselor: { en: 'AI counselor', ru: 'AI-наставник', kk: 'AI-кеңесші' },
}

export const SKILL_LABELS: LabelMap = {
  coding: { en: 'Coding', ru: 'Программирование', kk: 'Бағдарламалау' },
  problem_solving: { en: 'Problem solving', ru: 'Решение задач', kk: 'Мәселе шешу' },
  analysis: { en: 'Analysis', ru: 'Анализ', kk: 'Талдау' },
  statistics: { en: 'Statistics', ru: 'Статистика', kk: 'Статистика' },
  ml: { en: 'Machine learning', ru: 'Машинное обучение', kk: 'Машиналық оқыту' },
  security: { en: 'Security', ru: 'Безопасность', kk: 'Қауіпсіздік' },
  networks: { en: 'Networks', ru: 'Сети', kk: 'Желілер' },
  engineering: { en: 'Engineering', ru: 'Инженерия', kk: 'Инженерия' },
  empathy: { en: 'Empathy', ru: 'Эмпатия', kk: 'Эмпатия' },
  diagnosis: { en: 'Diagnosis', ru: 'Диагностика', kk: 'Диагностика' },
  care: { en: 'Care', ru: 'Забота', kk: 'Қамқорлық' },
  research: { en: 'Research', ru: 'Исследование', kk: 'Зерттеу' },
  lab: { en: 'Lab work', ru: 'Лабораторная работа', kk: 'Зертханалық жұмыс' },
  modeling: { en: 'Modeling', ru: 'Моделирование', kk: 'Модельдеу' },
  writing: { en: 'Writing', ru: 'Письмо', kk: 'Жазу' },
  planning: { en: 'Planning', ru: 'Планирование', kk: 'Жоспарлау' },
  communication: { en: 'Communication', ru: 'Коммуникация', kk: 'Коммуникация' },
  leadership: { en: 'Leadership', ru: 'Лидерство', kk: 'Көшбасшылық' },
  risk: { en: 'Risk-taking', ru: 'Принятие рисков', kk: 'Тәуекелге бару' },
  policy: { en: 'Policy', ru: 'Политика', kk: 'Саясат' },
  organization: { en: 'Organization', ru: 'Организованность', kk: 'Ұйымдастыру' },
  argument: { en: 'Argumentation', ru: 'Аргументация', kk: 'Дәлелдеу' },
  patience: { en: 'Patience', ru: 'Терпение', kk: 'Шыдамдылық' },
  support: { en: 'Support', ru: 'Поддержка', kk: 'Қолдау' },
  negotiation: { en: 'Negotiation', ru: 'Переговоры', kk: 'Келіссөздер' },
  languages: { en: 'Languages', ru: 'Языки', kk: 'Тілдер' },
  design: { en: 'Design', ru: 'Дизайн', kk: 'Дизайн' },
  drafting: { en: 'Drafting', ru: 'Черчение', kk: 'Сызу' },
  interviewing: { en: 'Interviewing', ru: 'Интервью', kk: 'Сұхбат алу' },
  storytelling: { en: 'Storytelling', ru: 'Сторителлинг', kk: 'Әңгімелеу' },
  editing: { en: 'Editing', ru: 'Редактирование', kk: 'Редакциялау' },
}

export function labelFor(map: LabelMap, key: string, locale: Locale): string {
  return map[key]?.[locale] ?? key
}
