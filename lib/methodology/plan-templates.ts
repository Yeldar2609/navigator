import type { Locale } from '@/lib/i18n/config'
import { interpolate } from '@/lib/utils/format'
import type { Route } from './routes'

// Multi-horizon plan builder (Day 3). Horizons 1/2/3/6 months draw months from a
// shared sequence of "archetypes" (explore → learn → practice → compare →
// improve → refine). Each month has a theme, goal, 4 weekly actions across the 6
// categories, a reflection prompt, and a success metric. Content is route-
// flavored via {route} (localized route title) and {topic}, interpolated at
// generation, so plans are specific without N× the translated strings.

export type PlanCategory = 'explore' | 'learn' | 'practice' | 'talk' | 'reflect' | 'decide'
export type PlanHorizon = 1 | 2 | 3 | 6
export const PLAN_HORIZONS: readonly PlanHorizon[] = [1, 2, 3, 6]

export interface GeneratedWeek {
  weekIndex: number // 1..4
  category: PlanCategory
  title: string
}
export interface GeneratedMonth {
  monthIndex: number // 1..N
  theme: string
  goal: string
  reflectionPrompt: string
  successMetric: string
  weeks: GeneratedWeek[]
}
export interface GeneratedPlan {
  horizonMonths: PlanHorizon
  months: GeneratedMonth[]
}

type ArchetypeKey = 'explore' | 'learn' | 'practice' | 'compare' | 'improve' | 'refine'

const HORIZON_SEQUENCE: Record<PlanHorizon, ArchetypeKey[]> = {
  1: ['explore'],
  2: ['explore', 'practice'],
  3: ['explore', 'learn', 'practice'],
  6: ['explore', 'learn', 'practice', 'compare', 'improve', 'refine'],
}

const ROUTE_TOPIC: Record<Route, Record<Locale, string>> = {
  technological: {
    en: 'programming, data, or AI',
    ru: 'программирование, данные или ИИ',
    kk: 'бағдарламалау, деректер немесе ЖИ',
  },
  research: { en: 'science and discovery', ru: 'наука и исследования', kk: 'ғылым және зерттеу' },
  managerial: {
    en: 'leading projects and people',
    ru: 'управление проектами и людьми',
    kk: 'жобалар мен адамдарды басқару',
  },
  social_humanitarian: {
    en: 'helping people and communities',
    ru: 'помощь людям и сообществам',
    kk: 'адамдар мен қоғамға көмек',
  },
  creative: { en: 'design, writing, or media', ru: 'дизайн, тексты или медиа', kk: 'дизайн, мәтін немесе медиа' },
}

interface ArchetypeCopy {
  theme: string
  goal: string
  reflection: string
  metric: string
  weeks: { category: PlanCategory; title: string }[]
}

// TODO_TRANSLATION_REVIEW: ru/kk plan content is a careful first pass.
const ARCHETYPES: Record<ArchetypeKey, Record<Locale, ArchetypeCopy>> = {
  explore: {
    en: {
      theme: 'Start exploring your direction',
      goal: 'Understand your {route} route and the careers in it',
      reflection: 'What surprised you, and what felt exciting?',
      metric: 'You can name 3 careers in your direction',
      weeks: [
        { category: 'explore', title: 'Learn what the {route} route means — read or watch one intro.' },
        { category: 'explore', title: 'Explore 3 {route} careers that catch your eye.' },
        { category: 'practice', title: 'Try one beginner activity related to {topic}.' },
        { category: 'reflect', title: 'Write down what felt interesting and choose your next focus.' },
      ],
    },
    ru: {
      theme: 'Начни исследовать своё направление',
      goal: 'Понять направление «{route}» и профессии в нём',
      reflection: 'Что тебя удивило, а что показалось интересным?',
      metric: 'Ты можешь назвать 3 профессии своего направления',
      weeks: [
        { category: 'explore', title: 'Узнай, что значит направление «{route}» — прочитай или посмотри вводное.' },
        { category: 'explore', title: 'Изучи 3 профессии направления «{route}», которые тебе интересны.' },
        { category: 'practice', title: 'Попробуй одно начальное занятие по теме «{topic}».' },
        { category: 'reflect', title: 'Запиши, что показалось интересным, и выбери следующий фокус.' },
      ],
    },
    kk: {
      theme: 'Бағытыңды зерттей баста',
      goal: '«{route}» бағытын және ондағы мамандықтарды түсіну',
      reflection: 'Сені не таңғалдырды, не қызық болды?',
      metric: 'Бағытыңның 3 мамандығын атай аласың',
      weeks: [
        { category: 'explore', title: '«{route}» бағыты нені білдіретінін біл — бір кіріспе оқы не көр.' },
        { category: 'explore', title: 'Қызықтыратын «{route}» бағытының 3 мамандығын зертте.' },
        { category: 'practice', title: '«{topic}» тақырыбы бойынша бір бастапқы әрекет байқап көр.' },
        { category: 'reflect', title: 'Не қызық болғанын жазып, келесі фокусыңды таңда.' },
      ],
    },
  },
  learn: {
    en: {
      theme: 'Learn the basics',
      goal: 'Build a first real skill in your direction',
      reflection: 'What was easier or harder than you expected?',
      metric: 'You completed one beginner lesson',
      weeks: [
        { category: 'learn', title: 'Pick one beginner course or tutorial in {topic}.' },
        { category: 'learn', title: 'Complete the first lesson and take notes.' },
        { category: 'practice', title: 'Do a small exercise to apply what you learned.' },
        { category: 'reflect', title: 'Note what you understood and what is still unclear.' },
      ],
    },
    ru: {
      theme: 'Изучи основы',
      goal: 'Получить первый реальный навык в своём направлении',
      reflection: 'Что было легче или труднее, чем ты ожидал?',
      metric: 'Ты прошёл один вводный урок',
      weeks: [
        { category: 'learn', title: 'Выбери один начальный курс или урок по теме «{topic}».' },
        { category: 'learn', title: 'Пройди первый урок и сделай заметки.' },
        { category: 'practice', title: 'Выполни небольшое упражнение, чтобы применить знания.' },
        { category: 'reflect', title: 'Запиши, что понял, а что ещё неясно.' },
      ],
    },
    kk: {
      theme: 'Негіздерді үйрен',
      goal: 'Бағытыңда алғашқы нақты дағдыны қалыптастыру',
      reflection: 'Не оңай, не қиын болды?',
      metric: 'Бір кіріспе сабақты аяқтадың',
      weeks: [
        { category: 'learn', title: '«{topic}» бойынша бір бастапқы курс не сабақ таңда.' },
        { category: 'learn', title: 'Алғашқы сабақты аяқтап, жазып ал.' },
        { category: 'practice', title: 'Үйренгеніңді қолдану үшін шағын жаттығу жаса.' },
        { category: 'reflect', title: 'Не түсінгеніңді, не әлі түсініксіз екенін жаз.' },
      ],
    },
  },
  practice: {
    en: {
      theme: 'Try it with a small project',
      goal: 'Apply your skill to something real',
      reflection: 'What are you proud of, and what would you do differently?',
      metric: 'You finished a tiny project or 5 practice tasks',
      weeks: [
        { category: 'practice', title: 'Plan a tiny {route} project you can finish in 3 weeks.' },
        { category: 'practice', title: 'Build the first half of your project.' },
        { category: 'practice', title: 'Finish your project or solve 5 practice tasks.' },
        { category: 'talk', title: 'Show it to a friend, teacher, or the AI counselor for feedback.' },
      ],
    },
    ru: {
      theme: 'Попробуй на небольшом проекте',
      goal: 'Применить навык к чему-то реальному',
      reflection: 'Чем ты гордишься и что сделал бы иначе?',
      metric: 'Ты сделал маленький проект или 5 практических задач',
      weeks: [
        { category: 'practice', title: 'Спланируй маленький проект «{route}», который успеешь за 3 недели.' },
        { category: 'practice', title: 'Сделай первую половину проекта.' },
        { category: 'practice', title: 'Заверши проект или реши 5 практических задач.' },
        { category: 'talk', title: 'Покажи другу, учителю или AI-наставнику для обратной связи.' },
      ],
    },
    kk: {
      theme: 'Шағын жобада байқап көр',
      goal: 'Дағдыңды нақты іске қолдану',
      reflection: 'Немен мақтанасың, нені басқаша жасар едің?',
      metric: 'Шағын жоба не 5 практикалық тапсырма жасадың',
      weeks: [
        { category: 'practice', title: '3 аптада үлгеретін шағын «{route}» жобасын жоспарла.' },
        { category: 'practice', title: 'Жобаңның бірінші жартысын жаса.' },
        { category: 'practice', title: 'Жобаңды аяқта не 5 практикалық тапсырманы шеш.' },
        { category: 'talk', title: 'Досыңа, мұғалімге не AI-кеңесшіге көрсетіп, пікір ал.' },
      ],
    },
  },
  compare: {
    en: {
      theme: 'Compare majors and universities',
      goal: 'See where this direction can lead after school',
      reflection: 'Which option excites you most, and why?',
      metric: 'You compared 3 majors or programs',
      weeks: [
        { category: 'explore', title: 'List majors connected to the {route} route.' },
        { category: 'explore', title: 'Compare 3 universities or programs for those majors.' },
        { category: 'talk', title: 'Ask someone (teacher, parent, or AI) about one program.' },
        { category: 'reflect', title: 'Note your top option and what you still want to know.' },
      ],
    },
    ru: {
      theme: 'Сравни специальности и университеты',
      goal: 'Увидеть, куда это направление ведёт после школы',
      reflection: 'Какой вариант тебя больше всего вдохновляет и почему?',
      metric: 'Ты сравнил 3 специальности или программы',
      weeks: [
        { category: 'explore', title: 'Составь список специальностей направления «{route}».' },
        { category: 'explore', title: 'Сравни 3 университета или программы по этим специальностям.' },
        { category: 'talk', title: 'Спроси кого-то (учителя, родителя или AI) об одной программе.' },
        { category: 'reflect', title: 'Запиши лучший вариант и что ещё хочешь узнать.' },
      ],
    },
    kk: {
      theme: 'Мамандықтар мен университеттерді салыстыр',
      goal: 'Бұл бағыт мектептен кейін қайда апаратынын көру',
      reflection: 'Қай нұсқа сені көбірек қызықтырады, неге?',
      metric: '3 мамандық не бағдарламаны салыстырдың',
      weeks: [
        { category: 'explore', title: '«{route}» бағытына қатысты мамандықтар тізімін жаса.' },
        { category: 'explore', title: 'Сол мамандықтар бойынша 3 университет не бағдарламаны салыстыр.' },
        { category: 'talk', title: 'Біреуден (мұғалім, ата-ана не AI) бір бағдарлама туралы сұра.' },
        { category: 'reflect', title: 'Үздік нұсқаңды және тағы не білгің келетінін жаз.' },
      ],
    },
  },
  improve: {
    en: {
      theme: 'Close a skill gap',
      goal: 'Strengthen the skill you found hardest',
      reflection: 'Where did you grow this month?',
      metric: 'You practiced your weak skill 4 times',
      weeks: [
        { category: 'learn', title: 'Pick the one skill you most want to improve.' },
        { category: 'practice', title: 'Practice it twice this week, even briefly.' },
        { category: 'practice', title: 'Practice it twice more and track your progress.' },
        { category: 'reflect', title: 'Notice how it got easier, even a little.' },
      ],
    },
    ru: {
      theme: 'Закрой пробел в навыках',
      goal: 'Усилить навык, который оказался самым трудным',
      reflection: 'В чём ты вырос за этот месяц?',
      metric: 'Ты практиковал слабый навык 4 раза',
      weeks: [
        { category: 'learn', title: 'Выбери один навык, который больше всего хочешь улучшить.' },
        { category: 'practice', title: 'Потренируй его дважды на этой неделе, пусть и недолго.' },
        { category: 'practice', title: 'Потренируй ещё дважды и отслеживай прогресс.' },
        { category: 'reflect', title: 'Заметь, как стало легче, пусть немного.' },
      ],
    },
    kk: {
      theme: 'Дағды олқылығын жап',
      goal: 'Ең қиын болған дағдыны күшейту',
      reflection: 'Осы айда қай жерде өстің?',
      metric: 'Әлсіз дағдыңды 4 рет жаттықтырдың',
      weeks: [
        { category: 'learn', title: 'Ең жақсартқың келетін бір дағдыны таңда.' },
        { category: 'practice', title: 'Осы аптада оны екі рет жаттықтыр, қысқа болса да.' },
        { category: 'practice', title: 'Тағы екі рет жаттықтырып, прогресіңді бақыла.' },
        { category: 'reflect', title: 'Аздап болса да жеңілдегенін байқа.' },
      ],
    },
  },
  refine: {
    en: {
      theme: 'Reflect and refine your route',
      goal: 'Check your direction against what you learned',
      reflection: 'Has your direction become clearer or shifted?',
      metric: 'You retook the assessment and updated your plan',
      weeks: [
        { category: 'reflect', title: 'Look back at everything you tried these months.' },
        { category: 'decide', title: 'Decide what to keep doing and what to drop.' },
        { category: 'explore', title: 'Retake the assessment to see how you have grown.' },
        { category: 'decide', title: 'Set your direction for the next 6 months.' },
      ],
    },
    ru: {
      theme: 'Поразмышляй и уточни направление',
      goal: 'Сверить направление с тем, что ты узнал',
      reflection: 'Стало ли твоё направление яснее или изменилось?',
      metric: 'Ты прошёл тест заново и обновил план',
      weeks: [
        { category: 'reflect', title: 'Оглянись на всё, что ты пробовал эти месяцы.' },
        { category: 'decide', title: 'Реши, что продолжить, а что оставить.' },
        { category: 'explore', title: 'Пройди тест заново и увидь, как ты вырос.' },
        { category: 'decide', title: 'Задай направление на следующие 6 месяцев.' },
      ],
    },
    kk: {
      theme: 'Ойланып, бағытыңды нақтыла',
      goal: 'Бағытыңды үйренгеніңмен салыстыру',
      reflection: 'Бағытың айқындала түсті ме әлде өзгерді ме?',
      metric: 'Тестті қайта өтіп, жоспарыңды жаңарттың',
      weeks: [
        { category: 'reflect', title: 'Осы айларда не жасағаныңа көз жүгірт.' },
        { category: 'decide', title: 'Нені жалғастырып, нені тоқтататыныңды шеш.' },
        { category: 'explore', title: 'Қалай өскеніңді көру үшін тестті қайта өт.' },
        { category: 'decide', title: 'Келесі 6 айға бағытыңды белгіле.' },
      ],
    },
  },
}

/** Build a deterministic multi-month plan for a route + horizon. */
export function generatePlan(
  route: Route,
  horizon: PlanHorizon,
  locale: Locale,
  routeTitle: string,
): GeneratedPlan {
  const vars = { route: routeTitle, topic: ROUTE_TOPIC[route][locale] }
  const months: GeneratedMonth[] = HORIZON_SEQUENCE[horizon].map((key, i) => {
    const a = ARCHETYPES[key][locale]
    return {
      monthIndex: i + 1,
      theme: interpolate(a.theme, vars),
      goal: interpolate(a.goal, vars),
      reflectionPrompt: interpolate(a.reflection, vars),
      successMetric: interpolate(a.metric, vars),
      weeks: a.weeks.map((w, wi) => ({
        weekIndex: wi + 1,
        category: w.category,
        title: interpolate(w.title, vars),
      })),
    }
  })
  return { horizonMonths: horizon, months }
}
