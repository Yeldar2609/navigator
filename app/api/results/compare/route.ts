import { compareResults } from '@/lib/methodology/comparison'
import type { ScoredResult } from '@/lib/methodology/scoring'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/utils/api'

export const dynamic = 'force-dynamic'

type ResultRow = {
  id: string
  primary_route: string
  primary_cluster: string
  secondary_cluster: string
  ipo_pct_100: number
  strengths: string[] | null
  growth_areas: string[] | null
}

// compareResults only reads route / cluster / score / strengths / growth_areas.
function toScore(r: ResultRow): ScoredResult {
  return {
    primaryRoute: r.primary_route,
    primaryCluster: r.primary_cluster,
    secondaryCluster: r.secondary_cluster,
    ipoPct100: r.ipo_pct_100,
    strengths: r.strengths ?? [],
    growthAreas: r.growth_areas ?? [],
  } as unknown as ScoredResult
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return fail('not_configured', 400)

  const { searchParams } = new URL(request.url)
  const currentId = searchParams.get('current')
  const previousId = searchParams.get('previous')
  if (!currentId || !previousId) return fail('missing_params', 422)

  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    const authId = auth.user?.id
    if (!authId) return fail('unauthorized', 401)

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', authId)
      .maybeSingle()
    if (!profile) return fail('no_profile', 400)

    // RLS + profile_id scope: a caller can only compare their own results.
    const { data: rows, error } = await supabase
      .from('assessment_results')
      .select(
        'id, primary_route, primary_cluster, secondary_cluster, ipo_pct_100, strengths, growth_areas',
      )
      .eq('profile_id', profile.id)
      .in('id', [currentId, previousId])
    if (error) return fail('compare_failed', 500)

    const byId = new Map((rows ?? []).map((r) => [r.id as string, r as ResultRow]))
    const current = byId.get(currentId)
    const previous = byId.get(previousId)
    if (!current || !previous) return fail('not_found', 404)

    return ok({ comparison: compareResults(toScore(previous), toScore(current)) })
  } catch {
    return fail('compare_failed', 500)
  }
}
