// SERVER-ONLY. Provider-agnostic LLM client over fetch (no SDK dependency). The
// API key is read from the environment and never leaves the server. If no key is
// configured, callLLM returns null and the caller uses the safe offline mock.

export type LLMMessage = { role: 'user' | 'assistant'; content: string }

const TIMEOUT_MS = 20_000

export function aiConfigured(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY)
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fn(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

// Retry once on transient failure (network/5xx/timeout).
async function withRetry(fn: () => Promise<string | null>): Promise<string | null> {
  try {
    return await fn()
  } catch {
    try {
      return await fn()
    } catch {
      return null
    }
  }
}

async function callAnthropic(
  key: string,
  system: string,
  messages: LLMMessage[],
): Promise<string | null> {
  const model = process.env.NAV_AI_MODEL || 'claude-sonnet-4-6'
  const res = await withTimeout((signal) =>
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 700, system, messages }),
    }),
  )
  if (!res.ok) throw new Error(`anthropic ${res.status}`)
  const data = (await res.json()) as { content?: { text?: string }[] }
  return data.content?.[0]?.text ?? null
}

async function callOpenAI(
  key: string,
  system: string,
  messages: LLMMessage[],
): Promise<string | null> {
  const model = process.env.NAV_AI_MODEL || 'gpt-4o-mini'
  const res = await withTimeout((signal) =>
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    }),
  )
  if (!res.ok) throw new Error(`openai ${res.status}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content ?? null
}

/** Call the configured LLM. Returns assistant text, or null if no key / failure. */
export async function callLLM(system: string, messages: LLMMessage[]): Promise<string | null> {
  const anthropic = process.env.ANTHROPIC_API_KEY
  const openai = process.env.OPENAI_API_KEY
  if (anthropic) return withRetry(() => callAnthropic(anthropic, system, messages))
  if (openai) return withRetry(() => callOpenAI(openai, system, messages))
  return null
}
