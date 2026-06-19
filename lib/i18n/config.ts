export const locales = ['kk', 'ru', 'en'] as const
export type Locale = (typeof locales)[number]

// Kazakhstan-first: Russian is the safest shared default for the MVP. The
// DEFAULT_LOCALE env var documents intent; routing falls back to this constant.
export const defaultLocale: Locale = 'ru'

export const localeLabels: Record<Locale, string> = {
  kk: 'Қазақша',
  ru: 'Русский',
  en: 'English',
}

export const localeShortLabels: Record<Locale, string> = {
  kk: 'KK',
  ru: 'RU',
  en: 'EN',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value)
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : defaultLocale
}
