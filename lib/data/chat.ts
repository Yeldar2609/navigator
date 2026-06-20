import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { CAREERS_BY_SLUG } from '@/lib/methodology/careers-data'
import { SKILL_LABELS, SUBJECT_LABELS, labelFor } from '@/lib/methodology/tag-labels'
import {
  generateCounselorReply,
  type ChatActionKind,
  type CounselorFactors,
  type CounselorReply,
} from '@/lib/ai/counselor'
import { buildSnapshot } from '@/lib/ai/snapshot'
import type { ChatResponse } from '@/lib/ai/schemas'
import { demoStore } from '@/lib/demo/store'
import { isDemoMode } from './mode'
import { getLatestResult } from './assessment'
import { getProfile } from './profile'
import { getPlan, nextPlanItem } from './plan'
import { getCheckIns } from './check-in'
import { getIdToken } from '@/lib/firebase/auth-client'
import type { StoredChatMessage, StoredChatThread } from './types'

export function getChatThread(): StoredChatThread | null {
  return demoStore.getChatThread()
}

/** Build the minimal AI snapshot + localized display factors from the local store. */
function buildContext(locale: Locale, dict: Messages) {
  const profile = getProfile()
  const result = getLatestResult()
  const plan = getPlan()
  const checkIns = getCheckIns()
  const score = result?.score ?? null
  const recs = result?.recommendations ?? []
  const recommendedCareers = recs
    .filter((r) => r.bucket === 'recommended')
    .slice(0, 3)
    .map((r) => r.slug)
  const fallbackCareers = recommendedCareers.length
    ? recommendedCareers
    : recs.slice(0, 3).map((r) => r.slug)
  const skillGaps = recs[0]?.skillGaps ?? []

  const snapshot = buildSnapshot({
    locale,
    gradeLevel: profile?.gradeLevel ?? null,
    score: score
      ? {
          awarenessLevel: score.awarenessLevel,
          ipoPct100: score.ipoPct100,
          primaryRoute: score.primaryRoute,
          primaryCluster: score.primaryCluster,
          secondaryCluster: score.secondaryCluster,
          strengths: score.strengths,
          growthAreas: score.growthAreas,
        }
      : null,
    recommendedCareers: fallbackCareers,
    skillGaps,
    plan: plan
      ? {
          horizonMonths: plan.horizonMonths,
          doneCount: plan.items.filter((i) => i.status === 'done').length,
          totalCount: plan.items.length,
          nextActionTitle: nextPlanItem(plan)?.title ?? null,
        }
      : null,
    checkIns: checkIns.map((c) => ({ mood: c.mood, confidence: c.confidence })),
  })

  const subjectSet = new Set<string>()
  for (const slug of fallbackCareers) {
    for (const subj of CAREERS_BY_SLUG[slug]?.subjectTags ?? []) subjectSet.add(subj)
  }

  const factors: CounselorFactors = {
    routeTitle: score ? dict.routes[score.primaryRoute].title : '',
    clusterTitle: score ? dict.clusters[score.primaryCluster].title : '',
    scorePct: score?.ipoPct100 ?? null,
    strengthLabel: score?.strengths[0] ? dict.assessment.blocks[score.strengths[0]] : '',
    careersList: fallbackCareers.map((s) => CAREERS_BY_SLUG[s]?.name[locale] ?? s).join(', '),
    skillsList: skillGaps.map((s) => labelFor(SKILL_LABELS, s, locale)).join(', '),
    subjectsList: [...subjectSet]
      .slice(0, 4)
      .map((s) => labelFor(SUBJECT_LABELS, s, locale))
      .join(', '),
    nextAction: plan ? (nextPlanItem(plan)?.title ?? '') : '',
  }

  return { snapshot, factors, displayName: profile?.displayName?.trim() || undefined }
}

async function sendToServer(
  message: string,
  threadId: string,
  locale: Locale,
  dict: Messages,
): Promise<CounselorReply> {
  try {
    // Attach the Firebase ID token so the route can verify identity (uid comes
    // only from this token, never from the body).
    const token = await getIdToken()
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, threadId, locale }),
    })
    const json = (await res.json()) as { ok: boolean; data?: ChatResponse }
    if (!res.ok || !json.ok || !json.data) throw new Error('chat_failed')
    const d = json.data
    return {
      text: d.assistant_message,
      intent: 'server',
      suggestedQuestions: d.suggested_questions,
      suggestedActions: d.suggested_actions.map((a) => ({
        kind: a.kind as ChatActionKind,
        label: a.label,
      })),
      referencedFactors: d.referenced_profile_factors,
      safetyNotice: d.safety_notice_optional,
    }
  } catch {
    return {
      text: dict.d4.chat.errorConnect,
      intent: 'error',
      suggestedQuestions: [],
      suggestedActions: [],
      referencedFactors: [],
    }
  }
}

/**
 * Send a message to the counselor. Demo mode runs the safe, profile-aware mock
 * locally (no network, no key); configured mode calls the server (real LLM or a
 * server-side fallback). The thread persists in the local store either way.
 */
export async function sendChatMessage(input: {
  message: string
  locale: Locale
  dict: Messages
}): Promise<{ thread: StoredChatThread; reply: CounselorReply }> {
  const { message, locale, dict } = input
  const now = new Date().toISOString()
  let thread =
    demoStore.getChatThread() ?? { id: demoStore.newId(), createdAt: now, messages: [] }

  const userMsg: StoredChatMessage = {
    id: demoStore.newId(),
    role: 'user',
    content: message,
    createdAt: now,
  }
  thread = { ...thread, messages: [...thread.messages, userMsg] }

  let reply: CounselorReply
  if (isDemoMode()) {
    const { snapshot, factors, displayName } = buildContext(locale, dict)
    reply = generateCounselorReply({ message, snapshot, factors, d4: dict.d4, displayName })
  } else {
    reply = await sendToServer(message, thread.id, locale, dict)
  }

  const assistantMsg: StoredChatMessage = {
    id: demoStore.newId(),
    role: 'assistant',
    content: reply.text,
    createdAt: new Date().toISOString(),
    suggestedActions: reply.suggestedActions,
    referencedFactors: reply.referencedFactors,
    safetyNotice: reply.safetyNotice,
  }
  thread = { ...thread, messages: [...thread.messages, assistantMsg] }
  demoStore.setChatThread(thread)
  return { thread, reply }
}
