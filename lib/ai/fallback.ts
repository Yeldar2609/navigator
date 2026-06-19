import type { Messages } from '@/lib/i18n/dictionaries'

/** Graceful, localized message when the AI can't be reached (key/network/timeout). */
export function fallbackText(d4: Messages['d4']): string {
  return d4.chat.errorConnect
}
