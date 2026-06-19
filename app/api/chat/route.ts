import { z } from 'zod'
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
import {
  baseSuggestions,
  generateCounselorReply,
  type CounselorFactors,
} from '@/lib/ai/counselor'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok, parseBody } from '@/lib/utils/api'
import { interpolate } from '@/lib/utils/format'

const chatRequestSchema = z.object({
  threadId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
  locale: z.string().optional(),
  resultId: z.string().uuid().optional(),
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
  const parsed = await parseBody(request, chatRequestSchema)
  if (!parsed.success) return parsed.response
  const { threadId, message, locale: rawLocale } = parsed.data
  const locale = resolveLocale(rawLocale ?? 'en')
  const dict = getDictionary(locale)
  const d4 = dict.d4

  const safety = await moderate(message)

  // Demo install (no Supabase): the client runs chat locally; this is a safe echo.
  if (!isSupabaseConfigured()) {
    const snapshot = buildSnapshot({ locale, gradeLevel: null, score: null })
    const reply = generateCounselorReply({ message, snapshot, factors: EMPTY_FACTORS, d4 })
    return ok({
      thread_id: 'local',
      assistant_message: reply.text,
      suggested_questions: reply.suggestedQuestions,
      suggested_actions: reply.suggestedActions,
      referenced_profile_factors: reply.referencedFactors,
      safety_notice_optional: reply.safetyNotice,
    })
  }

  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    const authId = auth.user?.id
    if (!authId) return fail('unauthorized', 401)

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, grade_level')
      .eq('auth_user_id', authId)
      .maybeSingle()
    if (!profile) return fail('no_profile', 400)

    // Resolve / create the thread (server-authoritative; client ids untrusted).
    let tid = threadId
    if (tid) {
      const owned = await supabase
        .from('chat_threads')
        .select('id')
        .eq('id', tid)
        .eq('profile_id', profile.id)
        .maybeSingle()
      if (!owned.data) tid = undefined
    }
    if (!tid) {
      const ins = await supabase
        .from('chat_threads')
        .insert({ profile_id: profile.id })
        .select('id')
        .single()
      if (ins.error) return fail('thread_failed', 500)
      tid = ins.data.id as string
    }

    await supabase.from('chat_messages').insert({
      thread_id: tid,
      profile_id: profile.id,
      role: 'user',
      content: message,
      moderation_json: { category: safety.category },
    })

    async function storeAssistant(content: string) {
      await supabase
        .from('chat_messages')
        .insert({ thread_id: tid, profile_id: profile!.id, role: 'assistant', content })
    }

    if (safety.category === 'crisis') {
      await storeAssistant(d4.safety.crisis)
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
      await storeAssistant(d4.safety.refuse)
      return ok({
        thread_id: tid,
        assistant_message: d4.safety.refuse,
        suggested_questions: [],
        suggested_actions: [],
        referenced_profile_factors: [],
      })
    }

    const { data: resultRow } = await supabase
      .from('assessment_results')
      .select(
        'ipo_pct_100, awareness_level, primary_route, primary_cluster, secondary_cluster, strengths, growth_areas, recommendations',
      )
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: planRow } = await supabase
      .from('plans')
      .select('id, horizon_months')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let planSummary: {
      horizonMonths: number
      doneCount: number
      totalCount: number
      nextActionTitle: string | null
    } | null = null
    if (planRow) {
      const { data: items } = await supabase
        .from('plan_items')
        .select('status, title')
        .eq('plan_id', planRow.id)
      const list = items ?? []
      planSummary = {
        horizonMonths: planRow.horizon_months as number,
        doneCount: list.filter((i) => i.status === 'done').length,
        totalCount: list.length,
        nextActionTitle: (list.find((i) => i.status !== 'done')?.title as string) ?? null,
      }
    }

    const { data: ciRows } = await supabase
      .from('check_ins')
      .select('mood_score, confidence_score')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
    const checkIns = (ciRows ?? []).map((r) => ({
      mood: r.mood_score as number,
      confidence: r.confidence_score as number,
    }))

    const recs =
      (resultRow?.recommendations as { slug: string; bucket?: string; skillGaps?: string[] }[] | null) ??
      []
    const recommended = recs.filter((r) => r.bucket === 'recommended').slice(0, 3).map((r) => r.slug)
    const careers = recommended.length ? recommended : recs.slice(0, 3).map((r) => r.slug)
    const skillGaps = recs[0]?.skillGaps ?? []

    const score: ScoreLite | null = resultRow
      ? {
          awarenessLevel: resultRow.awareness_level as AwarenessLevel,
          ipoPct100: resultRow.ipo_pct_100 as number,
          primaryRoute: resultRow.primary_route as Route,
          primaryCluster: resultRow.primary_cluster as Cluster,
          secondaryCluster: resultRow.secondary_cluster as Cluster,
          strengths: (resultRow.strengths as string[]) ?? [],
          growthAreas: (resultRow.growth_areas as string[]) ?? [],
        }
      : null

    const snapshot = buildSnapshot({
      locale,
      gradeLevel: (profile.grade_level as number | null) ?? null,
      score,
      recommendedCareers: careers,
      skillGaps,
      plan: planSummary,
      checkIns,
    })
    const factors = score
      ? buildFactors(locale, dict, score, careers, skillGaps, planSummary?.nextActionTitle ?? '')
      : EMPTY_FACTORS

    // Real LLM when a key is configured; otherwise the safe mock.
    let assistantText: string | null = null
    if (aiConfigured()) {
      assistantText = await callLLM(buildSystemPrompt(snapshot), [{ role: 'user', content: message }])
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
      await storeAssistant(assistantText)
      return ok({
        thread_id: tid,
        assistant_message: assistantText,
        suggested_questions: sugg.questions,
        suggested_actions: sugg.actions,
        referenced_profile_factors: referenced,
      })
    }

    const reply = generateCounselorReply({ message, snapshot, factors, d4 })
    await storeAssistant(reply.text)
    return ok({
      thread_id: tid,
      assistant_message: reply.text,
      suggested_questions: reply.suggestedQuestions,
      suggested_actions: reply.suggestedActions,
      referenced_profile_factors: reply.referencedFactors,
      safety_notice_optional: reply.safetyNotice,
    })
  } catch {
    return fail('chat_failed', 500)
  }
}
