import { ASSESSMENT_ITEMS } from '@/lib/methodology/assessment-items'
import { saveAnswerSchema } from '@/lib/validations/assessment'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok, parseBody } from '@/lib/utils/api'

const TOTAL = ASSESSMENT_ITEMS.length

// Server-authoritative: resolve (or open) the signed-in student's session
// rather than trusting a client-supplied id, scope the question lookup to the
// active template, and surface DB/RLS errors instead of swallowing them.
export async function POST(request: Request) {
  const parsed = await parseBody(request, saveAnswerSchema)
  if (!parsed.success) return parsed.response
  const { questionCode, value } = parsed.data

  // Demo mode tracks answers in the local store (see lib/data/assessment.ts).
  if (!isSupabaseConfigured()) return ok({ saved: true, answeredCount: null, totalCount: TOTAL })

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

    const { data: template } = await supabase
      .from('assessment_templates')
      .select('id')
      .eq('active', true)
      .maybeSingle()
    if (!template) return fail('no_active_template', 500)

    let { data: session } = await supabase
      .from('assessment_sessions')
      .select('id')
      .eq('profile_id', profile.id)
      .in('status', ['started', 'in_progress'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!session) {
      const created = await supabase
        .from('assessment_sessions')
        .insert({ profile_id: profile.id, template_id: template.id, status: 'in_progress' })
        .select('id')
        .single()
      if (created.error || !created.data) return fail('session_failed', 500)
      session = created.data
    }

    const { data: question } = await supabase
      .from('assessment_questions')
      .select('id')
      .eq('template_id', template.id)
      .eq('item_code', questionCode)
      .maybeSingle()
    if (!question) return fail('unknown_question', 400)

    const upsert = await supabase
      .from('assessment_answers')
      .upsert(
        { session_id: session.id, question_id: question.id, value },
        { onConflict: 'session_id,question_id' },
      )
    if (upsert.error) return fail('save_failed', 500)

    const { count, error: countErr } = await supabase
      .from('assessment_answers')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
    if (countErr) return fail('save_failed', 500)

    return ok({ saved: true, answeredCount: count ?? 0, totalCount: TOTAL })
  } catch {
    return fail('save_failed', 500)
  }
}
