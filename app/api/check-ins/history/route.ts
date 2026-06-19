import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/utils/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Demo mode reads from the local store client-side (see lib/data/check-in.ts).
  if (!isSupabaseConfigured()) return ok({ checkIns: [] })

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

    // RLS ("own check_ins") also scopes this to the caller's rows.
    const { data, error } = await supabase
      .from('check_ins')
      .select('id, mood_score, confidence_score, effort_score, blocker, note, created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return fail('history_failed', 500)

    return ok({ checkIns: data ?? [] })
  } catch {
    return fail('history_failed', 500)
  }
}
