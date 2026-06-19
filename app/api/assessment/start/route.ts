import { ASSESSMENT_ITEMS } from '@/lib/methodology/assessment-items'
import { TEMPLATE_VERSION } from '@/lib/methodology/scoring-config'
import { startAssessmentSchema } from '@/lib/validations/assessment'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { ok, parseBody } from '@/lib/utils/api'

// Returns the active template's questions (from config — always works). When
// Supabase is configured and the user is signed in, also creates a DB session.
export async function POST(request: Request) {
  const parsed = await parseBody(request, startAssessmentSchema)
  if (!parsed.success) return parsed.response

  let sessionId: string | null = null
  let templateId: string | null = null

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      const authId = auth.user?.id
      if (authId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', authId)
          .maybeSingle()
        const { data: template } = await supabase
          .from('assessment_templates')
          .select('id')
          .eq('active', true)
          .maybeSingle()
        templateId = template?.id ?? null
        if (profile?.id && template?.id) {
          const { data: session } = await supabase
            .from('assessment_sessions')
            .insert({ profile_id: profile.id, template_id: template.id, status: 'in_progress' })
            .select('id')
            .single()
          sessionId = session?.id ?? null
        }
      }
    } catch {
      /* fall through to questions-only response */
    }
  }

  return ok({ sessionId, templateId, templateVersion: TEMPLATE_VERSION, questions: ASSESSMENT_ITEMS })
}
