import { defaultLocale, type Locale } from './config'
import en, { type Messages } from './messages/en'
import kk from './messages/kk'
import ru from './messages/ru'

const dictionaries: Record<Locale, Messages> = { en, ru, kk }

/**
 * Synchronous dictionary lookup. Messages are static TS modules, so there is no
 * async/network cost. Server and client components both call this.
 */
export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries[defaultLocale]
}

export type { Messages }
