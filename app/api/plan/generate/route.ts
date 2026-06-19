import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { generatePlan as buildPlanTemplate } from '@/lib/methodology/plan-templates'
import { isRoute, type Route } from '@/lib/methodology/routes'
import { generatePlanSchema } from '@/lib/validations/plan'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok, parseBody } from '@/lib/utils/api'

export async function POST(request: Request) {
  const parsed = await parseBody(request, generatePlanSchema)
  if (!parsed.success) return parsed.response
  const { horizonMonths } = parsed.data

  // Demo mode builds + persists the plan client-side (see lib/data/plan.ts).
  if (!isSupabaseConfigured()) return ok({ clientGenerated: true })

  try {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    const authId = auth.user?.id
    if (!authId) return fail('unauthorized', 401)

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, preferred_language')
      .eq('auth_user_id', authId)
      .maybeSingle()
    if (!profile) return fail('no_profile', 400)

    // Server-authoritative: latest result for the profile.
    const { data: result } = await supabase
      .from('assessment_results')
      .select('id, primary_route')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!result) return fail('no_result', 404)

    const route: Route = isRoute(result.primary_route as string)
      ? (result.primary_route as Route)
      : 'technological'
    const locale = isLocale(profile.preferred_language) ? profile.preferred_language : 'ru'
    const dict = getDictionary(locale)
    const generated = buildPlanTemplate(route, horizonMonths, locale, dict.routes[route].title)

    const plan = await supabase
      .from('plans')
      .insert({
        profile_id: profile.id,
        result_id: result.id,
        horizon_months: horizonMonths,
        status: 'active',
        title: dict.d2.plan.generatedNote,
        plan_json: { route, months: generated.months },
      })
      .select('id')
      .single()
    if (plan.error || !plan.data) return fail('plan_failed', 500)

    const itemsInsert = await supabase.from('plan_items').insert(
      generated.months.flatMap((m) =>
        m.weeks.map((w) => ({
          plan_id: plan.data.id,
          month_index: m.monthIndex,
          week_index: w.weekIndex,
          title: w.title,
          category: w.category,
          status: 'todo',
        })),
      ),
    )
    if (itemsInsert.error) return fail('plan_items_failed', 500)

    return ok({ plan_id: plan.data.id, horizon_months: horizonMonths, months: generated.months })
  } catch {
    return fail('plan_failed', 500)
  }
}
