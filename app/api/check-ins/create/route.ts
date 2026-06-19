import { z } from 'zod'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok, parseBody } from '@/lib/utils/api'

const createCheckInSchema = z.object({
  // planId is intentionally NOT trusted from the client — the server links the
  // student's own latest plan to avoid cross-user references.
  moodScore: z.number().int().min(1).max(5),
  confidenceScore: z.number().int().min(1).max(5),
  effortScore: z.number().int().min(1).max(5),
  blocker: z.string().max(500).optional(),
  note: z.string().max(1000).optional(),
})

export async function POST(request: Request) {
  const parsed = await parseBody(request, createCheckInSchema)
  if (!parsed.success) return parsed.response
  const { moodScore, confidenceScore, effortScore, blocker, note } = parsed.data

  // Demo mode records into the local store (see lib/data/check-in.ts).
  if (!isSupabaseConfigured()) return ok({ clientCreated: true })

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

    // Link the student's own latest plan (server-resolved, never client-supplied).
    const { data: ownPlan } = await supabase
      .from('plans')
      .select('id')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const inserted = await supabase
      .from('check_ins')
      .insert({
        profile_id: profile.id,
        plan_id: ownPlan?.id ?? null,
        mood_score: moodScore,
        confidence_score: confidenceScore,
        effort_score: effortScore,
        blocker: blocker ?? null,
        note: note ?? null,
      })
      .select('id, created_at')
      .single()
    if (inserted.error) return fail('persist_failed', 500)

    return ok({ id: inserted.data?.id ?? null, created_at: inserted.data?.created_at ?? null })
  } catch {
    return fail('create_failed', 500)
  }
}
