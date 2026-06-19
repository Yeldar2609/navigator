import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/utils/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Demo mode reads the latest result from the local store on the client.
  if (!isSupabaseConfigured()) return ok({ result: null, demo: true })

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
    if (!profile) return ok({ result: null })

    const { data: result } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return ok({ result: result ?? null })
  } catch {
    return fail('fetch_failed', 500)
  }
}
