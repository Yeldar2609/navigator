// SERVER-ONLY. Google Conversational Agents / Dialogflow CX client.
//
// The browser NEVER calls Google directly — only /api/chat (server) calls this.
// When the agent is not configured (no DIALOGFLOW_CX_AGENT_ID / location), the
// client reports "not configured" and the route falls back to the deterministic
// template counselor. We never fake AI as real in production.
import { GoogleAuth } from 'google-auth-library'
import { isAiCounselorConfigured } from '@/lib/env'

export interface DialogflowReply {
  text: string
  /** True when the agent returned a no-match / default response. */
  fallback: boolean
  provider: 'dialogflow_cx'
  agentId: string
  languageCode: string
  safetyStatus: 'ok'
}

export function isDialogflowConfigured(): boolean {
  return isAiCounselorConfigured()
}

const TIMEOUT_MS = 20_000

let cachedAuth: GoogleAuth | null = null
function getAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth
  cachedAuth = new GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  return cachedAuth
}

function host(location: string): string {
  // The "global" region uses the unprefixed host; all others are region-prefixed.
  return location === 'global'
    ? 'https://dialogflow.googleapis.com'
    : `https://${location}-dialogflow.googleapis.com`
}

interface ResponseMessage {
  text?: { text?: string[] }
}
interface DetectIntentResponse {
  queryResult?: {
    responseMessages?: ResponseMessage[]
    match?: { matchType?: string }
  }
}

/**
 * Send one user turn to the configured Dialogflow CX agent. Returns the reply, or
 * null if unconfigured / on any error (caller falls back). Identity must already
 * be verified by the route; `sessionId` should be derived from the user id.
 */
export async function detectIntentText(input: {
  sessionId: string
  text: string
  languageCode: string
  parameters?: Record<string, unknown>
}): Promise<DialogflowReply | null> {
  if (!isAiCounselorConfigured()) return null

  const project = process.env.DIALOGFLOW_CX_PROJECT_ID as string
  const location = process.env.DIALOGFLOW_CX_LOCATION as string
  const agentId = process.env.DIALOGFLOW_CX_AGENT_ID as string

  const url =
    `${host(location)}/v3/projects/${project}/locations/${location}` +
    `/agents/${agentId}/sessions/${encodeURIComponent(input.sessionId)}:detectIntent`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const token = await getAuth().getAccessToken()
    if (!token) return null

    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        queryInput: {
          text: { text: input.text },
          languageCode: input.languageCode,
        },
        queryParams: input.parameters ? { parameters: input.parameters } : undefined,
      }),
    })
    if (!res.ok) return null

    const data = (await res.json()) as DetectIntentResponse
    const messages = data.queryResult?.responseMessages ?? []
    const text = messages
      .flatMap((m) => m.text?.text ?? [])
      .join(' ')
      .trim()
    if (!text) return null

    const matchType = data.queryResult?.match?.matchType
    const fallback = matchType === 'NO_MATCH' || matchType === 'DEFAULT'

    return {
      text,
      fallback,
      provider: 'dialogflow_cx',
      agentId,
      languageCode: input.languageCode,
      safetyStatus: 'ok',
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
