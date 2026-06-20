import type { Locale } from '@/lib/i18n/config'
import type { Career } from './careers-data'
import type { Route } from './routes'

// In-app mirror of supabase/seed.sql majors for the zero-backend demo. CURATED
// DEMO DATA. `subjectTags` use the same keys as onboarding favorite_subjects.
// Careers are linked to majors by route + subject affinity (see relatedMajorsFor)
// rather than a hand-curated per-career list — a transparent, maintainable rule.
// TODO: replace with real KZ university program data + ENT subject requirements.

export interface Major {
  slug: string
  route: Route
  subjectTags: string[]
  name: Record<Locale, string>
}

export const MAJORS: Major[] = [
  // technological
  {
    slug: 'computer_science',
    route: 'technological',
    subjectTags: ['informatics', 'mathematics'],
    name: { en: 'Computer Science', ru: 'Информатика', kk: 'Информатика' },
  },
  {
    slug: 'information_systems',
    route: 'technological',
    subjectTags: ['informatics', 'business_economics'],
    name: { en: 'Information Systems', ru: 'Информационные системы', kk: 'Ақпараттық жүйелер' },
  },
  {
    slug: 'electrical_engineering',
    route: 'technological',
    subjectTags: ['physics', 'informatics'],
    name: { en: 'Electrical Engineering', ru: 'Электротехника', kk: 'Электр инженериясы' },
  },
  {
    slug: 'mechanical_engineering',
    route: 'technological',
    subjectTags: ['physics', 'mathematics'],
    name: { en: 'Mechanical Engineering', ru: 'Машиностроение', kk: 'Машина жасау' },
  },
  // research
  {
    slug: 'mathematics',
    route: 'research',
    subjectTags: ['mathematics'],
    name: { en: 'Mathematics', ru: 'Математика', kk: 'Математика' },
  },
  {
    slug: 'physics',
    route: 'research',
    subjectTags: ['physics', 'mathematics'],
    name: { en: 'Physics', ru: 'Физика', kk: 'Физика' },
  },
  {
    slug: 'biology',
    route: 'research',
    subjectTags: ['biology', 'chemistry'],
    name: { en: 'Biology', ru: 'Биология', kk: 'Биология' },
  },
  {
    slug: 'chemistry',
    route: 'research',
    subjectTags: ['chemistry'],
    name: { en: 'Chemistry', ru: 'Химия', kk: 'Химия' },
  },
  {
    slug: 'medicine',
    route: 'research',
    subjectTags: ['biology', 'chemistry'],
    name: { en: 'Medicine', ru: 'Медицина', kk: 'Медицина' },
  },
  {
    slug: 'environmental_science',
    route: 'research',
    subjectTags: ['biology', 'geography'],
    name: { en: 'Environmental Science', ru: 'Экология', kk: 'Экология' },
  },
  {
    slug: 'psychology',
    route: 'research',
    subjectTags: ['biology', 'social_science'],
    name: { en: 'Psychology', ru: 'Психология', kk: 'Психология' },
  },
  // managerial
  {
    slug: 'economics',
    route: 'managerial',
    subjectTags: ['mathematics', 'business_economics'],
    name: { en: 'Economics', ru: 'Экономика', kk: 'Экономика' },
  },
  {
    slug: 'business_administration',
    route: 'managerial',
    subjectTags: ['business_economics', 'mathematics'],
    name: {
      en: 'Business Administration',
      ru: 'Бизнес-администрирование',
      kk: 'Бизнесті басқару',
    },
  },
  {
    slug: 'finance',
    route: 'managerial',
    subjectTags: ['mathematics', 'business_economics'],
    name: { en: 'Finance', ru: 'Финансы', kk: 'Қаржы' },
  },
  {
    slug: 'law',
    route: 'managerial',
    subjectTags: ['history', 'social_science'],
    name: { en: 'Law', ru: 'Юриспруденция', kk: 'Құқықтану' },
  },
  {
    slug: 'public_administration',
    route: 'managerial',
    subjectTags: ['social_science', 'history'],
    name: { en: 'Public Administration', ru: 'Государственное управление', kk: 'Мемлекеттік басқару' },
  },
  // social_humanitarian
  {
    slug: 'education',
    route: 'social_humanitarian',
    subjectTags: ['history', 'social_science'],
    name: { en: 'Education', ru: 'Педагогика', kk: 'Педагогика' },
  },
  {
    slug: 'sociology',
    route: 'social_humanitarian',
    subjectTags: ['social_science', 'history'],
    name: { en: 'Sociology', ru: 'Социология', kk: 'Әлеуметтану' },
  },
  {
    slug: 'international_relations',
    route: 'social_humanitarian',
    subjectTags: ['languages', 'history', 'geography'],
    name: { en: 'International Relations', ru: 'Международные отношения', kk: 'Халықаралық қатынастар' },
  },
  {
    slug: 'linguistics',
    route: 'social_humanitarian',
    subjectTags: ['languages', 'literature'],
    name: { en: 'Linguistics', ru: 'Лингвистика', kk: 'Лингвистика' },
  },
  {
    slug: 'social_work',
    route: 'social_humanitarian',
    subjectTags: ['social_science'],
    name: { en: 'Social Work', ru: 'Социальная работа', kk: 'Әлеуметтік жұмыс' },
  },
  // creative
  {
    slug: 'marketing',
    route: 'creative',
    subjectTags: ['business_economics', 'languages'],
    name: { en: 'Marketing', ru: 'Маркетинг', kk: 'Маркетинг' },
  },
  {
    slug: 'design',
    route: 'creative',
    subjectTags: ['art_design'],
    name: { en: 'Design', ru: 'Дизайн', kk: 'Дизайн' },
  },
  {
    slug: 'architecture',
    route: 'creative',
    subjectTags: ['art_design', 'mathematics', 'physics'],
    name: { en: 'Architecture', ru: 'Архитектура', kk: 'Сәулет' },
  },
  {
    slug: 'journalism',
    route: 'creative',
    subjectTags: ['languages', 'literature'],
    name: { en: 'Journalism', ru: 'Журналистика', kk: 'Журналистика' },
  },

  // --- Day-6 expansion to production catalog (>=32 majors) ---
  // TODO(provenance): replace with sourced KZ university program data + ENT
  // subject requirements when available.
  // technological
  {
    slug: 'software_engineering',
    route: 'technological',
    subjectTags: ['informatics', 'mathematics'],
    name: { en: 'Software Engineering', ru: 'Программная инженерия', kk: 'Бағдарламалық инженерия' },
  },
  {
    slug: 'data_science',
    route: 'technological',
    subjectTags: ['mathematics', 'informatics'],
    name: { en: 'Data Science', ru: 'Наука о данных', kk: 'Деректер ғылымы' },
  },
  {
    slug: 'cybersecurity',
    route: 'technological',
    subjectTags: ['informatics'],
    name: { en: 'Cybersecurity', ru: 'Кибербезопасность', kk: 'Киберқауіпсіздік' },
  },
  {
    slug: 'robotics',
    route: 'technological',
    subjectTags: ['physics', 'informatics'],
    name: { en: 'Robotics', ru: 'Робототехника', kk: 'Робототехника' },
  },
  // research
  {
    slug: 'pharmacy',
    route: 'research',
    subjectTags: ['chemistry', 'biology'],
    name: { en: 'Pharmacy', ru: 'Фармация', kk: 'Фармация' },
  },
  {
    slug: 'geology',
    route: 'research',
    subjectTags: ['geography', 'chemistry'],
    name: { en: 'Geology', ru: 'Геология', kk: 'Геология' },
  },
  {
    slug: 'agronomy',
    route: 'research',
    subjectTags: ['biology', 'geography'],
    name: { en: 'Agronomy', ru: 'Агрономия', kk: 'Агрономия' },
  },
  {
    slug: 'veterinary_medicine',
    route: 'research',
    subjectTags: ['biology', 'chemistry'],
    name: { en: 'Veterinary Medicine', ru: 'Ветеринария', kk: 'Ветеринария' },
  },
  {
    slug: 'history',
    route: 'research',
    subjectTags: ['history', 'social_science'],
    name: { en: 'History', ru: 'История', kk: 'Тарих' },
  },
  // managerial
  {
    slug: 'accounting',
    route: 'managerial',
    subjectTags: ['mathematics', 'business_economics'],
    name: { en: 'Accounting', ru: 'Бухгалтерский учёт', kk: 'Бухгалтерлік есеп' },
  },
  {
    slug: 'management',
    route: 'managerial',
    subjectTags: ['business_economics', 'mathematics'],
    name: { en: 'Management', ru: 'Менеджмент', kk: 'Менеджмент' },
  },
  {
    slug: 'logistics',
    route: 'managerial',
    subjectTags: ['business_economics', 'geography'],
    name: { en: 'Logistics', ru: 'Логистика', kk: 'Логистика' },
  },
  // social_humanitarian
  {
    slug: 'public_health',
    route: 'social_humanitarian',
    subjectTags: ['biology', 'social_science'],
    name: { en: 'Public Health', ru: 'Общественное здравоохранение', kk: 'Қоғамдық денсаулық сақтау' },
  },
  {
    slug: 'physical_education',
    route: 'social_humanitarian',
    subjectTags: ['biology', 'social_science'],
    name: { en: 'Physical Education', ru: 'Физическая культура', kk: 'Дене шынықтыру' },
  },
  // creative
  {
    slug: 'fine_arts',
    route: 'creative',
    subjectTags: ['art_design'],
    name: { en: 'Fine Arts', ru: 'Изобразительное искусство', kk: 'Бейнелеу өнері' },
  },
  {
    slug: 'film_and_media',
    route: 'creative',
    subjectTags: ['art_design', 'literature'],
    name: { en: 'Film & Media', ru: 'Кино и медиа', kk: 'Кино және медиа' },
  },
  {
    slug: 'music',
    route: 'creative',
    subjectTags: ['art_design'],
    name: { en: 'Music', ru: 'Музыка', kk: 'Музыка' },
  },
]

export const MAJORS_BY_SLUG: Record<string, Major> = Object.fromEntries(
  MAJORS.map((m) => [m.slug, m]),
)

/**
 * Majors related to a career: same route first, then majors sharing a subject.
 * Deterministic, always returns at least one (every route has majors).
 */
export function relatedMajorsFor(career: Career, limit = 4): Major[] {
  const byRoute = MAJORS.filter((m) => m.route === career.route)
  const bySubject = MAJORS.filter(
    (m) => m.route !== career.route && m.subjectTags.some((s) => career.subjectTags.includes(s)),
  )
  const seen = new Set<string>()
  const out: Major[] = []
  for (const m of [...byRoute, ...bySubject]) {
    if (seen.has(m.slug)) continue
    seen.add(m.slug)
    out.push(m)
    if (out.length >= limit) break
  }
  return out
}
