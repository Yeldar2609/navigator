import { updatePlanItemSchema } from '@/lib/validations/plan'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok, parseBody } from '@/lib/utils/api'

export async function POST(request: Request) {
  const parsed = await parseBody(request, updatePlanItemSchema)
  if (!parsed.success) return parsed.response
  const { planItemId, status, completionPercent } = parsed.data

  // Demo mode updates the local store (see lib/data/plan.ts).
  if (!isSupabaseConfigured()) return ok({ clientUpdated: true })

  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user?.id) return fail('unauthorized', 401)

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) patch.status = status
    if (typeof completionPercent === 'number') patch.completion_percent = completionPercent
    if (status === 'done' && completionPercent == null) patch.completion_percent = 100

    // RLS (plan → profile) ensures a caller can only touch their own items.
    // .select() so a 0-row update surfaces as not_found instead of a silent ok.
    const { data, error } = await supabase
      .from('plan_items')
      .update(patch)
      .eq('id', planItemId)
      .select('id')
    if (error) return fail('update_failed', 500)
    if (!data || data.length === 0) return fail('not_found', 404)
    return ok({ updated: true })
  } catch {
    return fail('update_failed', 500)
  }
}
