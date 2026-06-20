import type { Locale } from '@/lib/i18n/config'
import type { Cluster } from './clusters'
import type { Route } from './routes'

// Curated catalog of well-known Kazakhstan universities for the zero-backend demo.
// CURATED DATA — names, cities and the route/cluster affinities below are curated
// editorial signals, NOT official admissions data. The app must NOT present
// admissions requirements from this file; entries carry `verifyAdmissions: true`,
// meaning "verify official admissions details" against the university and the
// Ministry of Science and Higher Education (see docs/DATA_SOURCES.md).
//
// Source of the institution list / official higher-education information:
//   - Ministry of Science and Higher Education of the Republic of Kazakhstan
//     (https://www.gov.kz/memleket/entities/sci) — official body for universities.
//   - Each university's own official site (linked per-entry as `sourceUrl`).
//
// TODO(provenance): admissions requirements, tuition and ENT thresholds must be
// verified per-year from official sources before they are ever displayed.

export interface University {
  slug: string
  name: Record<Locale, string>
  city: Record<Locale, string>
  description: Record<Locale, string>
  /** Professional routes this university is especially associated with. Reuses
   *  the existing Route enum — no new routes are invented. */
  routes: Route[]
  /** Assessment clusters this university tends to suit. Reuses the Cluster enum. */
  clusters: Cluster[]
  /** Where the institution information came from (official body or the school). */
  source: 'ministry_science_higher_education' | 'university_official'
  sourceUrl: string
  /** Always true: admissions details are NOT curated here and must be verified
   *  against official sources for the current admissions year. */
  verifyAdmissions: true
}

export const UNIVERSITIES: University[] = [
  {
    slug: 'nazarbayev_university',
    name: {
      en: 'Nazarbayev University',
      ru: 'Назарбаев Университет',
      kk: 'Назарбаев Университеті',
    },
    city: { en: 'Astana', ru: 'Астана', kk: 'Астана' },
    description: {
      en: 'English-language research university with engineering, science, medicine and business schools.',
      ru: 'Англоязычный исследовательский университет: инженерия, естественные науки, медицина и бизнес.',
      kk: 'Ағылшын тілді зерттеу университеті: инженерия, жаратылыстану, медицина және бизнес.',
    },
    routes: ['technological', 'research', 'managerial'],
    clusters: ['digital_innovator', 'researcher', 'strategist'],
    source: 'university_official',
    sourceUrl: 'https://nu.edu.kz',
    verifyAdmissions: true,
  },
  {
    slug: 'kaznu_al_farabi',
    name: {
      en: 'Al-Farabi Kazakh National University (KazNU)',
      ru: 'Казахский национальный университет имени аль-Фараби (КазНУ)',
      kk: 'Әл-Фараби атындағы Қазақ ұлттық университеті (ҚазҰУ)',
    },
    city: { en: 'Almaty', ru: 'Алматы', kk: 'Алматы' },
    description: {
      en: 'Kazakhstan’s flagship classical national university with broad science and humanities faculties.',
      ru: 'Ведущий классический национальный университет с широким спектром естественных и гуманитарных факультетов.',
      kk: 'Жаратылыстану және гуманитарлық факультеттері кең классикалық ұлттық университет.',
    },
    routes: ['research', 'social_humanitarian', 'technological'],
    clusters: ['researcher', 'social_leader', 'digital_innovator'],
    source: 'university_official',
    sourceUrl: 'https://www.kaznu.kz',
    verifyAdmissions: true,
  },
  {
    slug: 'enu_gumilyov',
    name: {
      en: 'L.N. Gumilyov Eurasian National University (ENU)',
      ru: 'Евразийский национальный университет имени Л.Н. Гумилёва (ЕНУ)',
      kk: 'Л.Н. Гумилёв атындағы Еуразия ұлттық университеті (ЕҰУ)',
    },
    city: { en: 'Astana', ru: 'Астана', kk: 'Астана' },
    description: {
      en: 'Large national university in the capital, strong in humanities, social sciences and natural sciences.',
      ru: 'Крупный национальный университет столицы: гуманитарные, социальные и естественные науки.',
      kk: 'Елордадағы ірі ұлттық университет: гуманитарлық, әлеуметтік және жаратылыстану ғылымдары.',
    },
    routes: ['social_humanitarian', 'research', 'managerial'],
    clusters: ['social_leader', 'researcher', 'strategist'],
    source: 'university_official',
    sourceUrl: 'https://www.enu.kz',
    verifyAdmissions: true,
  },
  {
    slug: 'kbtu',
    name: {
      en: 'Kazakh-British Technical University (KBTU)',
      ru: 'Казахстанско-Британский технический университет (КБТУ)',
      kk: 'Қазақстан-Британ техникалық университеті (ҚБТУ)',
    },
    city: { en: 'Almaty', ru: 'Алматы', kk: 'Алматы' },
    description: {
      en: 'Technical university focused on IT, energy, geology and finance, with English-medium programs.',
      ru: 'Технический университет: ИТ, энергетика, геология и финансы; программы на английском языке.',
      kk: 'IT, энергетика, геология және қаржыға бағытталған техникалық университет; ағылшын тілінде.',
    },
    routes: ['technological', 'managerial', 'research'],
    clusters: ['digital_innovator', 'strategist', 'researcher'],
    source: 'university_official',
    sourceUrl: 'https://kbtu.edu.kz',
    verifyAdmissions: true,
  },
  {
    slug: 'satbayev_university',
    name: {
      en: 'Satbayev University',
      ru: 'Сатбаев Университет',
      kk: 'Сәтбаев Университеті',
    },
    city: { en: 'Almaty', ru: 'Алматы', kk: 'Алматы' },
    description: {
      en: 'Leading technical university for engineering, geology, mining and the energy sector.',
      ru: 'Ведущий технический университет: инженерия, геология, горное дело и энергетика.',
      kk: 'Инженерия, геология, тау-кен ісі және энергетика бойынша жетекші техникалық университет.',
    },
    routes: ['technological', 'research'],
    clusters: ['digital_innovator', 'researcher', 'creator'],
    source: 'university_official',
    sourceUrl: 'https://satbayev.university',
    verifyAdmissions: true,
  },
  {
    slug: 'kimep_university',
    name: {
      en: 'KIMEP University',
      ru: 'Университет КИМЭП',
      kk: 'КИМЭП Университеті',
    },
    city: { en: 'Almaty', ru: 'Алматы', kk: 'Алматы' },
    description: {
      en: 'English-language university known for business, economics, law and social sciences.',
      ru: 'Англоязычный университет, известный программами по бизнесу, экономике, праву и социальным наукам.',
      kk: 'Бизнес, экономика, құқық және әлеуметтік ғылымдармен танымал ағылшын тілді университет.',
    },
    routes: ['managerial', 'social_humanitarian'],
    clusters: ['strategist', 'social_leader'],
    source: 'university_official',
    sourceUrl: 'https://www.kimep.kz',
    verifyAdmissions: true,
  },
  {
    slug: 'almau',
    name: {
      en: 'Almaty Management University (AlmaU)',
      ru: 'Алматы Менеджмент Университет (AlmaU)',
      kk: 'Алматы Менеджмент Университеті (AlmaU)',
    },
    city: { en: 'Almaty', ru: 'Алматы', kk: 'Алматы' },
    description: {
      en: 'Business-focused university with strong entrepreneurship, management and marketing programs.',
      ru: 'Бизнес-ориентированный университет: предпринимательство, менеджмент и маркетинг.',
      kk: 'Кәсіпкерлік, менеджмент және маркетингке бағытталған бизнес-университет.',
    },
    routes: ['managerial', 'creative'],
    clusters: ['strategist', 'creator'],
    source: 'university_official',
    sourceUrl: 'https://almau.edu.kz',
    verifyAdmissions: true,
  },
  {
    slug: 'sdu',
    name: {
      en: 'SDU University (Suleyman Demirel University)',
      ru: 'Университет SDU (Университет имени Сулеймана Демиреля)',
      kk: 'SDU Университеті (Сүлейман Демирел атындағы университет)',
    },
    city: { en: 'Kaskelen', ru: 'Каскелен', kk: 'Қаскелең' },
    description: {
      en: 'English-medium university near Almaty with engineering, IT, education and business faculties.',
      ru: 'Англоязычный университет рядом с Алматы: инженерия, ИТ, образование и бизнес.',
      kk: 'Алматы маңындағы ағылшын тілді университет: инженерия, IT, білім беру және бизнес.',
    },
    routes: ['technological', 'social_humanitarian', 'managerial'],
    clusters: ['digital_innovator', 'social_leader', 'strategist'],
    source: 'university_official',
    sourceUrl: 'https://sdu.edu.kz',
    verifyAdmissions: true,
  },
]

export const UNIVERSITIES_BY_SLUG: Record<string, University> = Object.fromEntries(
  UNIVERSITIES.map((u) => [u.slug, u]),
)
