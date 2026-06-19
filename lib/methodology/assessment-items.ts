import type { Locale } from '@/lib/i18n/config'

// 40 assessment items in 4 blocks of 10 (interests, competencies, values,
// strengths), Likert 1–5. Item codes are Q1..Q40 and are the stable key used by
// the DB seed (`assessment_questions.item_code`) and the cluster mapping.
//
// NOTE (docs/METHODOLOGY_ASSUMPTIONS.md): prompt wording is a student-friendly
// paraphrase. The exact thesis item text was not available at build time, so
// these are illustrative-but-plausible and marked for review.

export const BLOCKS = ['interests', 'competencies', 'values', 'strengths'] as const
export type Block = (typeof BLOCKS)[number]

export interface AssessmentItem {
  code: string // Q1..Q40
  block: Block
  orderIndex: number // 1-based
  promptKey: string // dictionary-style key, also stored in DB
  minValue: number
  maxValue: number
}

function blockForIndex(n: number): Block {
  if (n <= 10) return 'interests'
  if (n <= 20) return 'competencies'
  if (n <= 30) return 'values'
  return 'strengths'
}

export const ASSESSMENT_ITEMS: AssessmentItem[] = Array.from({ length: 40 }, (_, i) => {
  const n = i + 1
  return {
    code: `Q${n}`,
    block: blockForIndex(n),
    orderIndex: n,
    promptKey: `assessment.items.Q${n}`,
    minValue: 1,
    maxValue: 5,
  } satisfies AssessmentItem
})

export const ITEM_CODES: string[] = ASSESSMENT_ITEMS.map((item) => item.code)
export const ITEM_COUNT = ASSESSMENT_ITEMS.length

export function itemsByBlock(block: Block): AssessmentItem[] {
  return ASSESSMENT_ITEMS.filter((item) => item.block === block)
}

export function isBlock(value: string): value is Block {
  return (BLOCKS as readonly string[]).includes(value)
}

// Localized prompt text. Kept in the methodology layer (not the UI dictionary)
// so the 120 strings don't bloat the type-checked `Messages` shape.
// TODO_TRANSLATION_REVIEW: ru/kk wording needs a native pass before launch.
export const ITEM_PROMPTS: Record<string, Record<Locale, string>> = {
  // --- Block 1: Interests (Q1–Q10) ---
  Q1: {
    en: 'I enjoy figuring out how machines or programs work.',
    ru: 'Мне нравится разбираться, как работают машины или программы.',
    kk: 'Машиналар мен бағдарламалардың қалай жұмыс істейтінін түсіну ұнайды.',
  },
  Q2: {
    en: 'I like organizing events or leading group activities.',
    ru: 'Мне нравится организовывать мероприятия или вести групповые занятия.',
    kk: 'Іс-шараларды ұйымдастыру немесе топтық жұмысты бастау ұнайды.',
  },
  Q3: {
    en: 'I enjoy drawing, designing, or making things look good.',
    ru: 'Мне нравится рисовать, придумывать дизайн или делать вещи красивыми.',
    kk: 'Сурет салу, дизайн ойлап табу немесе нәрсені әдемі ету ұнайды.',
  },
  Q4: {
    en: 'I am curious about why people behave the way they do.',
    ru: 'Мне интересно, почему люди ведут себя так, как ведут.',
    kk: 'Адамдардың неге олай әрекет ететіні қызық.',
  },
  Q5: {
    en: 'I like experimenting with new technology.',
    ru: 'Мне нравится экспериментировать с новыми технологиями.',
    kk: 'Жаңа технологиялармен тәжірибе жасау ұнайды.',
  },
  Q6: {
    en: 'I enjoy helping classmates solve their problems.',
    ru: 'Мне нравится помогать одноклассникам решать их проблемы.',
    kk: 'Сыныптастарға мәселелерін шешуге көмектесу ұнайды.',
  },
  Q7: {
    en: 'I like writing stories, articles, or scripts.',
    ru: 'Мне нравится писать рассказы, статьи или сценарии.',
    kk: 'Әңгіме, мақала немесе сценарий жазу ұнайды.',
  },
  Q8: {
    en: 'I am drawn to questions in science and nature.',
    ru: 'Меня притягивают вопросы науки и природы.',
    kk: 'Ғылым мен табиғат сұрақтары қызықтырады.',
  },
  Q9: {
    en: 'I enjoy planning how to reach a goal step by step.',
    ru: 'Мне нравится планировать, как достичь цели шаг за шагом.',
    kk: 'Мақсатқа қадам-қадаммен жетуді жоспарлау ұнайды.',
  },
  Q10: {
    en: 'I like building or fixing things with my hands.',
    ru: 'Мне нравится создавать или чинить вещи своими руками.',
    kk: 'Заттарды қолыммен жасау немесе жөндеу ұнайды.',
  },
  // --- Block 2: Competencies / abilities (Q11–Q20) ---
  Q11: {
    en: 'I can break a big problem into smaller steps.',
    ru: 'Я умею разбивать большую задачу на маленькие шаги.',
    kk: 'Үлкен мәселені кіші қадамдарға бөле аламын.',
  },
  Q12: {
    en: 'I quickly understand new apps or tools.',
    ru: 'Я быстро разбираюсь в новых приложениях и инструментах.',
    kk: 'Жаңа қолданбалар мен құралдарды тез түсінемін.',
  },
  Q13: {
    en: 'I am good at calming a disagreement between people.',
    ru: 'У меня получается гасить разногласия между людьми.',
    kk: 'Адамдар арасындағы келіспеушілікті басуды жақсы білемін.',
  },
  Q14: {
    en: 'I can persuade others to support an idea.',
    ru: 'Я умею убеждать других поддержать идею.',
    kk: 'Басқаларды идеяны қолдауға сендіре аламын.',
  },
  Q15: {
    en: 'I can sketch or visualize an idea clearly.',
    ru: 'Я могу наглядно изобразить или визуализировать идею.',
    kk: 'Идеяны анық сызып не елестете аламын.',
  },
  Q16: {
    en: 'I am good at analyzing data or numbers.',
    ru: 'У меня хорошо получается анализировать данные и числа.',
    kk: 'Деректер мен сандарды талдауды жақсы білемін.',
  },
  Q17: {
    en: 'I stay organized when juggling several tasks.',
    ru: 'Я остаюсь организованным, когда задач много.',
    kk: 'Бірнеше іс қатар жүргенде ұйымшыл боламын.',
  },
  Q18: {
    en: 'I explain difficult ideas so others understand.',
    ru: 'Я объясняю сложные идеи так, что другие понимают.',
    kk: 'Күрделі идеяларды басқалар түсінетіндей түсіндіремін.',
  },
  Q19: {
    en: 'I notice details that others miss.',
    ru: 'Я замечаю детали, которые другие упускают.',
    kk: 'Басқалар байқамайтын ұсақ-түйекті байқаймын.',
  },
  Q20: {
    en: 'I learn new skills faster than most.',
    ru: 'Я осваиваю новые навыки быстрее многих.',
    kk: 'Жаңа дағдыларды көпшіліктен тез меңгеремін.',
  },
  // --- Block 3: Values (Q21–Q30) ---
  Q21: {
    en: 'It matters to me that my work helps other people.',
    ru: 'Для меня важно, чтобы моя работа помогала людям.',
    kk: 'Жұмысым адамдарға көмектесуі маған маңызды.',
  },
  Q22: {
    en: 'I want a career with stable income and security.',
    ru: 'Я хочу профессию со стабильным доходом и надёжностью.',
    kk: 'Тұрақты табыс пен сенімділігі бар мамандық қалаймын.',
  },
  Q23: {
    en: 'I value creating something original.',
    ru: 'Я ценю возможность создавать что-то оригинальное.',
    kk: 'Бірегей нәрсе жасауды бағалаймын.',
  },
  Q24: {
    en: 'I want to keep learning throughout my life.',
    ru: 'Я хочу учиться всю жизнь.',
    kk: 'Өмір бойы оқығым келеді.',
  },
  Q25: {
    en: 'I care about leading or having responsibility.',
    ru: 'Мне важно вести за собой и нести ответственность.',
    kk: 'Көшбасшылық пен жауапкершілік маған маңызды.',
  },
  Q26: {
    en: 'Making a positive social impact is important to me.',
    ru: 'Для меня важно приносить пользу обществу.',
    kk: 'Қоғамға оң ықпал ету маған маңызды.',
  },
  Q27: {
    en: 'I value independence and freedom in how I work.',
    ru: 'Я ценю независимость и свободу в работе.',
    kk: 'Жұмыста дербестік пен еркіндікті бағалаймын.',
  },
  Q28: {
    en: 'I want recognition for doing excellent work.',
    ru: 'Я хочу признания за отличную работу.',
    kk: 'Үздік жұмысым үшін мойындалуды қалаймын.',
  },
  Q29: {
    en: 'I care about understanding how the world works.',
    ru: 'Мне важно понимать, как устроен мир.',
    kk: 'Әлемнің қалай жұмыс істейтінін түсіну маған маңызды.',
  },
  Q30: {
    en: 'I want my work to give me variety, not routine.',
    ru: 'Я хочу, чтобы работа давала разнообразие, а не рутину.',
    kk: 'Жұмысым біркелкілік емес, алуандық берсе екен.',
  },
  // --- Block 4: Strengths (Q31–Q40) ---
  Q31: {
    en: 'I keep going even when something is hard.',
    ru: 'Я продолжаю, даже когда трудно.',
    kk: 'Қиын болса да жалғастыра беремін.',
  },
  Q32: {
    en: 'I stay calm under pressure.',
    ru: 'Я сохраняю спокойствие под давлением.',
    kk: 'Қысым кезінде сабырлы боламын.',
  },
  Q33: {
    en: 'I am reliable — people can count on me.',
    ru: 'Я надёжен — на меня можно положиться.',
    kk: 'Сенімдімін — маған сүйенуге болады.',
  },
  Q34: {
    en: 'I come up with creative ideas.',
    ru: 'Я придумываю креативные идеи.',
    kk: 'Креативті идеялар ойлап табамын.',
  },
  Q35: {
    en: 'I am empathetic and read how others feel.',
    ru: 'Я эмпатичен и чувствую состояние других.',
    kk: 'Эмпатияшылмын, басқалардың көңілін ұғамын.',
  },
  Q36: {
    en: 'I think logically and carefully.',
    ru: 'Я мыслю логично и внимательно.',
    kk: 'Логикалы әрі мұқият ойлаймын.',
  },
  Q37: {
    en: 'I am imaginative and see new possibilities.',
    ru: 'У меня богатое воображение, я вижу новые возможности.',
    kk: 'Қиялым бай, жаңа мүмкіндіктерді көремін.',
  },
  Q38: {
    en: 'I am curious and ask a lot of questions.',
    ru: 'Я любопытен и задаю много вопросов.',
    kk: 'Білуге құмармын, көп сұрақ қоямын.',
  },
  Q39: {
    en: 'I am organized and plan ahead.',
    ru: 'Я организован и планирую заранее.',
    kk: 'Ұйымшылмын, алдын ала жоспарлаймын.',
  },
  Q40: {
    en: 'I adapt quickly when plans change.',
    ru: 'Я быстро адаптируюсь, когда планы меняются.',
    kk: 'Жоспар өзгергенде тез бейімделемін.',
  },
}

export function promptFor(code: string, locale: Locale): string {
  return ITEM_PROMPTS[code]?.[locale] ?? code
}
