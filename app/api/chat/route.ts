import { z } from 'zod'
import { FieldValue } from 'firebase-admin/firestore'
import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary, type Messages } from '@/lib/i18n/dictionaries'
import type { Block } from '@/lib/methodology/assessment-items'
import type { Cluster } from '@/lib/methodology/clusters'
import type { Route } from '@/lib/methodology/routes'
import type { AwarenessLevel } from '@/lib/methodology/awareness-index'
import { CAREERS_BY_SLUG } from '@/lib/methodology/careers-data'
import { SKILL_LABELS, SUBJECT_LABELS, labelFor } from '@/lib/methodology/tag-labels'
import { aiConfigured, callLLM } from '@/lib/ai/client'
import { moderate } from '@/lib/ai/moderation'
import { buildSnapshot } from '@/lib/ai/snapshot'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { checkScope } from '@/lib/ai/counselor-guardrails'
import { detectIntentText, isDialogflowConfigured } from '@/lib/ai/dialogflow-client'
import { buildCounselorContext, toDialogflowParameters } from '@/lib/ai/context-builder'
import {
  baseSuggestions,
  generateCounselorReply,
  type CounselorFactors,
} from '@/lib/ai/counselor'
import { getAdminDb, getAuthedUser } from '@/lib/firebase/admin'
import type { StoredResult, StoredPlan, StoredCheckIn } from '@/lib/data/types'
import { isAiCounselorConfigured } from '@/lib/env'
import { fail, ok, parseBody } from '@/lib/utils/api'
import { interpolate } from '@/lib/utils/format'

const chatRequestSchema = z.object({
  // Firestore doc ids (not UUIDs) — a non-empty string is the caller's own thread id.
  threadId: z.string().min(1).optional(),
  message: z.string().min(1).max(2000),
  locale: z.string().optional(),
  resultId: z.string().optional(),
})

type ScoreLite = {
  awarenessLevel: AwarenessLevel
  ipoPct100: number
  primaryRoute: Route
  primaryCluster: Cluster
  secondaryCluster: Cluster
  strengths: string[]
  growthAreas: string[]
}

const EMPTY_FACTORS: CounselorFactors = {
  routeTitle: '',
  clusterTitle: '',
  scorePct: null,
  strengthLabel: '',
  careersList: '',
  skillsList: '',
  subjectsList: '',
  nextAction: '',
}

function buildFactors(
  locale: 'en' | 'ru' | 'kk',
  dict: Messages,
  score: ScoreLite,
  careers: string[],
  skillGaps: string[],
  nextAction: string,
): CounselorFactors {
  const subjectSet = new Set<string>()
  for (const slug of careers) {
    for (const subj of CAREERS_BY_SLUG[slug]?.subjectTags ?? []) subjectSet.add(subj)
  }
  return {
    routeTitle: dict.routes[score.primaryRoute].title,
    clusterTitle: dict.clusters[score.primaryCluster].title,
    scorePct: score.ipoPct100,
    strengthLabel: score.strengths[0]
      ? dict.assessment.blocks[score.strengths[0] as Block]
      : '',
    careersList: careers.map((s) => CAREERS_BY_SLUG[s]?.name[locale] ?? s).join(', '),
    skillsList: skillGaps.map((s) => labelFor(SKILL_LABELS, s, locale)).join(', '),
    subjectsList: [...subjectSet]
      .slice(0, 4)
      .map((s) => labelFor(SUBJECT_LABELS, s, locale))
      .join(', '),
    nextAction,
  }
}

export async function POST(request: Request) {
  // Fail CLOSED: the AI counselor is disabled-safe. When it is not configured
  // (no Dialogflow CX agent) we return 503 BEFORE any other work — this closes
  // the unauthenticated-public-endpoint hole (the route never touches Firestore
  // or the deterministic template fallback) and matches the disabled chat UI.
  if (!isAiCounselorConfigured()) {
    return fail('ai_unavailable', 503)
  }

  // AUTH (Firebase): identity comes ONLY from the verified ID token. We NEVER
  // trust a uid from the body — every read/write below is scoped to this uid.
  const decoded = await getAuthedUser(request)
  if (!decoded) return fail('unauthorized', 401)
  const uid = decoded.uid

  const parsed = await parseBody(request, chatRequestSchema)
  if (!parsed.success) return parsed.response
  const { threadId: bodyThreadId, message, locale: rawLocale } = parsed.data
  const locale = resolveLocale(rawLocale ?? 'en')
  const dict = getDictionary(locale)
  const d4 = dict.d4

  const db = getAdminDb()
  if (!db) return fail('chat_unavailable', 503)

  try {
    // Resolve the thread id. A non-empty body.threadId is used as the doc id
    // under THIS uid's chatThreads (ownership is implicit — we only ever write
    // beneath users/{uid}/...). Otherwise mint a fresh id from Firestore.
    const userRef = db.collection('users').doc(uid)
    const threadsCol = userRef.collection('chatThreads')
    // Only accept a clean doc-id (uuid/nanoid charset) as the thread id; anything
    // else mints a fresh id. (It is already confined to this uid's subtree, but
    // this avoids malformed Firestore paths from an odd client value.)
    const tid =
      bodyThreadId && /^[A-Za-z0-9_-]{1,128}$/.test(bodyThreadId)
        ? bodyThreadId
        : threadsCol.doc().id
    const threadRef = threadsCol.doc(tid)
    const messagesCol = threadRef.collection('messages')

    // Best-effort, PRIVATE chat persistence. A storage failure must NEVER break
    // the reply. Chats live ONLY under users/{uid}/chatThreads/** — admin reads
    // (assessmentResults/plans/checkIns) never touch this, so they stay private.
    async function storeMessage(
      role: 'user' | 'assistant',
      content: string,
      aiMeta?: Record<string, unknown>,
    ): Promise<void> {
      try {
        await threadRef.set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true })
        await messagesCol.add({
          role,
          content,
          createdAt: FieldValue.serverTimestamp(),
          ...(aiMeta ? { aiMeta } : {}),
        })
      } catch {
        /* persistence is best-effort; never block the reply */
      }
    }

    const safety = await moderate(message)
    await storeMessage('user', message)

    if (safety.category === 'crisis') {
      await storeMessage('assistant', d4.safety.crisis)
      return ok({
        thread_id: tid,
        assistant_message: d4.safety.crisis,
        suggested_questions: [],
        suggested_actions: [],
        referenced_profile_factors: [],
        safety_notice_optional: d4.safety.notice,
      })
    }
    if (safety.category === 'harmful') {
      await storeMessage('assistant', d4.safety.refuse)
      return ok({
        thread_id: tid,
        assistant_message: d4.safety.refuse,
        suggested_questions: [],
        suggested_actions: [],
        referenced_profile_factors: [],
      })
    }

    // Out-of-scope (coding/homework/medical/therapy/sensitive-data) → redirect.
    const scope = checkScope(message, locale)
    if (!scope.allowed && scope.redirect) {
      const meta = { provider: 'guardrail', fallback: true, reason: scope.reason }
      await storeMessage('assistant', scope.redirect, meta)
      return ok({
        thread_id: tid,
        assistant_message: scope.redirect,
        suggested_questions: [],
        suggested_actions: [],
        referenced_profile_factors: [],
        ai_meta: meta,
      })
    }

    // READ CONTEXT from Firestore for THIS uid only (mirrors the admin _lib
    // reads, but for the caller's own data): user doc + latest result + latest
    // plan + recent check-ins.
    const [userSnap, resultSnap, planSnap, checkInSnap] = await Promise.all([
      userRef.get(),
      userRef.collection('assessmentResults').orderBy('createdAt', 'desc').limit(1).get(),
      userRef.collection('plans').orderBy('createdAt', 'desc').limit(1).get(),
      userRef.collection('checkIns').orderBy('createdAt', 'desc').limit(5).get(),
    ])

    const userData = userSnap.exists ? (userSnap.data() as Record<string, unknown>) : {}
    const gradeLevel = typeof userData.gradeLevel === 'number' ? userData.gradeLevel : null

    const result = resultSnap.empty ? null : (resultSnap.docs[0].data() as StoredResult)
    const plan = planSnap.empty ? null : (planSnap.docs[0].data() as StoredPlan)
    const checkIns = checkInSnap.docs.map((d) => {
      const ci = d.data() as StoredCheckIn
      return { mood: ci.mood, confidence: ci.confidence }
    })

    const recs = result?.recommendations ?? []
    const recommended = recs.filter((r) => r.bucket === 'recommended').slice(0, 3).map((r) => r.slug)
    const careers = recommended.length ? recommended : recs.slice(0, 3).map((r) => r.slug)
    const skillGaps = recs[0]?.skillGaps ?? []

    const score: ScoreLite | null = result
      ? {
          awarenessLevel: result.score.awarenessLevel,
          ipoPct100: result.score.ipoPct100,
          primaryRoute: result.score.primaryRoute,
          primaryCluster: result.score.primaryCluster,
          secondaryCluster: result.score.secondaryCluster,
          strengths: result.score.strengths ?? [],
          growthAreas: result.score.growthAreas ?? [],
        }
      : null

    let planSummary: {
      horizonMonths: number
      doneCount: number
      totalCount: number
      nextActionTitle: string | null
    } | null = null
    if (plan && Array.isArray(plan.items)) {
      const items = plan.items
      planSummary = {
        horizonMonths: plan.horizonMonths,
        doneCount: items.filter((i) => i.status === 'done').length,
        totalCount: items.length,
        nextActionTitle: items.find((i) => i.status !== 'done')?.title ?? null,
      }
    }

    const snapshot = buildSnapshot({
      locale,
      gradeLevel,
      score,
      recommendedCareers: careers,
      skillGaps,
      plan: planSummary,
      checkIns,
    })
    const factors = score
      ? buildFactors(locale, dict, score, careers, skillGaps, planSummary?.nextActionTitle ?? '')
      : EMPTY_FACTORS

    // Prefer the Dialogflow CX agent when configured; else a text LLM; else the
    // deterministic template fallback below. We never fake AI as real. The
    // session id is the verified uid (server-side identity only).
    let assistantText: string | null = null
    let aiProvider: 'dialogflow_cx' | 'llm' | 'template' = 'template'
    let aiFallback = true
    if (isDialogflowConfigured()) {
      const ctx = buildCounselorContext(snapshot)
      const df = await detectIntentText({
        sessionId: uid,
        text: message,
        languageCode: locale,
        parameters: toDialogflowParameters(ctx),
      })
      if (df && !df.fallback && df.text) {
        assistantText = df.text
        aiProvider = 'dialogflow_cx'
        aiFallback = false
      }
    }
    if (!assistantText && aiConfigured()) {
      assistantText = await callLLM(buildSystemPrompt(snapshot), [{ role: 'user', content: message }])
      if (assistantText) {
        aiProvider = 'llm'
        aiFallback = false
      }
    }

    // Output-side guardrail (defense in depth): a model can be jailbroken into
    // unsafe/off-scope content despite the prompt policy. Re-run the deterministic
    // safety + scope classifiers on the REPLY; on a trip, drop the model output and
    // fall through to the safe deterministic template (crisis short-circuits).
    if (assistantText) {
      const outSafety = await moderate(assistantText)
      if (outSafety.category === 'crisis') {
        await storeMessage('assistant', d4.safety.crisis, {
          provider: aiProvider,
          fallback: true,
          language: locale,
        })
        return ok({
          thread_id: tid,
          assistant_message: d4.safety.crisis,
          suggested_questions: [],
          suggested_actions: [],
          referenced_profile_factors: [],
          safety_notice_optional: d4.safety.notice,
          ai_meta: { provider: aiProvider, fallback: true, language: locale },
        })
      }
      if (outSafety.category === 'harmful' || !checkScope(assistantText, locale).allowed) {
        assistantText = null // fall through to the safe deterministic template below
      }
    }

    if (assistantText) {
      const sugg = baseSuggestions(snapshot, d4)
      const referenced: string[] = []
      if (score) {
        referenced.push(
          dict.routes[score.primaryRoute].title,
          dict.clusters[score.primaryCluster].title,
          interpolate(d4.chat.factorScore, { score: score.ipoPct100 }),
        )
      }
      const meta = { provider: aiProvider, fallback: aiFallback, language: locale }
      await storeMessage('assistant', assistantText, meta)
      return ok({
        thread_id: tid,
        assistant_message: assistantText,
        suggested_questions: sugg.questions,
        suggested_actions: sugg.actions,
        referenced_profile_factors: referenced,
        ai_meta: meta,
      })
    }

    const reply = generateCounselorReply({ message, snapshot, factors, d4 })
    const meta = { provider: 'template', fallback: true, language: locale }
    await storeMessage('assistant', reply.text, meta)
    return ok({
      thread_id: tid,
      assistant_message: reply.text,
      suggested_questions: reply.suggestedQuestions,
      suggested_actions: reply.suggestedActions,
      referenced_profile_factors: reply.referencedFactors,
      safety_notice_optional: reply.safetyNotice,
      ai_meta: meta,
    })
  } catch {
    return fail('chat_failed', 500)
  }
}
