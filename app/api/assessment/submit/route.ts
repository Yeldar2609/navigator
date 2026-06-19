import { ASSESSMENT_ITEMS } from '@/lib/methodology/assessment-items'
import { recommendCareers } from '@/lib/methodology/recommendations'
import { scoreAssessment } from '@/lib/methodology/scoring'
import type { SupportPreference } from '@/lib/methodology/scoring-config'
import { submitAssessmentSchema } from '@/lib/validations/assessment'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok, parseBody } from '@/lib/utils/api'

export async function POST(request: Request) {
  const parsed = await parseBody(request, submitAssessmentSchema)
  if (!parsed.success) return parsed.response

  // Demo mode computes + persists client-side (see lib/data/assessment.ts).
  if (!isSupabaseConfigured()) return ok({ clientScored: true })

  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    const authId = auth.user?.id
    if (!authId) return fail('unauthorized', 401)

    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'id, grade_level, career_confidence, support_preference, favorite_subjects, current_goals',
      )
      .eq('auth_user_id', authId)
      .maybeSingle()
    if (!profile) return fail('no_profile', 400)

    const { data: template } = await supabase
      .from('assessment_templates')
      .select('id')
      .eq('active', true)
      .maybeSingle()
    if (!template) return fail('no_active_template', 500)

    const { data: session } = await supabase
      .from('assessment_sessions')
      .select('id')
      .eq('profile_id', profile.id)
      .in('status', ['started', 'in_progress'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!session) return fail('no_session', 400)

    const { data: answerRows } = await supabase
      .from('assessment_answers')
      .select('question_id, value')
      .eq('session_id', session.id)
    const { data: questionRows } = await supabase
      .from('assessment_questions')
      .select('id, item_code')
      .eq('template_id', template.id)

    const codeById = new Map((questionRows ?? []).map((q) => [q.id as string, q.item_code as string]))
    const answers: Record<string, number> = {}
    for (const row of answerRows ?? []) {
      const code = codeById.get(row.question_id as string)
      if (code) answers[code] = row.value as number
    }

    // Completeness guard: never score a partially answered assessment.
    if (Object.keys(answers).length < ASSESSMENT_ITEMS.length) {
      return fail('incomplete_assessment', 422, {
        answered: Object.keys(answers).length,
        total: ASSESSMENT_ITEMS.length,
      })
    }

    const onboarding = {
      careerConfidence: profile.career_confidence ?? undefined,
      supportPreference: (profile.support_preference ?? undefined) as SupportPreference | undefined,
      favoriteSubjects: (profile.favorite_subjects ?? []) as string[],
      currentGoals: (profile.current_goals ?? []) as string[],
    }
    const score = scoreAssessment(answers, { onboarding, planGenerated: false })
    const recommendations = recommendCareers({
      primaryRoute: score.primaryRoute,
      primaryCluster: score.primaryCluster,
      secondaryCluster: score.secondaryCluster,
      favoriteSubjects: onboarding.favoriteSubjects,
      currentGoals: onboarding.currentGoals,
      gradeLevel: (profile.grade_level ?? null) as number | null,
    })

    const inserted = await supabase
      .from('assessment_results')
      .insert({
        session_id: session.id,
        profile_id: profile.id,
        template_version: score.templateVersion,
        scoring_version: score.scoringVersion,
        ipo_raw_60: score.ipoRaw60,
        ipo_pct_100: score.ipoPct100,
        awareness_level: score.awarenessLevel,
        primary_cluster: score.primaryCluster,
        secondary_cluster: score.secondaryCluster,
        primary_route: score.primaryRoute,
        cluster_scores: score.clusterScores,
        block_scores: score.blockScores,
        strengths: score.strengths,
        growth_areas: score.growthAreas,
        recommendations,
        result_json: { score, recommendations, routeModifier: score.routeModifier ?? null },
      })
      .select('id')
      .single()
    if (inserted.error) return fail('persist_failed', 500)

    await supabase
      .from('assessment_sessions')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', session.id)

    return ok({
      result_id: inserted.data?.id ?? null,
      ipo_raw_60: score.ipoRaw60,
      ipo_pct_100: score.ipoPct100,
      awareness_level: score.awarenessLevel,
      primary_cluster: score.primaryCluster,
      secondary_cluster: score.secondaryCluster,
      primary_route: score.primaryRoute,
      cluster_scores: score.clusterScores,
      block_scores: score.blockScores,
      strengths: score.strengths,
      growth_areas: score.growthAreas,
      recommendations,
    })
  } catch {
    return fail('submit_failed', 500)
  }
}
