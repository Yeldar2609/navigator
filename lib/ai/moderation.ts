import { classifyMessage, type SafetyResult } from './safety'

/**
 * Moderation gate. The local crisis/harm classifier is ALWAYS the gate so safety
 * works with no external service configured. An external moderation API could be
 * layered in here later; today we rely on the deterministic local check.
 */
export async function moderate(text: string): Promise<SafetyResult> {
  return classifyMessage(text)
}
