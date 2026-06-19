import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/utils/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Demo reads history from the local store client-side.
  if (!isSupabaseConfigured()) return ok({ history: [] })

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

    const { data, error } = await supabase
      .from('assessment_results')
      .select('id, created_at, primary_route, primary_cluster, ipo_pct_100, awareness_level')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: true })
    if (error) return fail('history_failed', 500)

    return ok({ history: data ?? [] })
  } catch {
    return fail('history_failed', 500)
  }
}
