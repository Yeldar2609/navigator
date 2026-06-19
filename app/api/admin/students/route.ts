import { isAdminRole } from '@/lib/admin/access'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/utils/api'

export const dynamic = 'force-dynamic'

type LatestResult = {
  profile_id: string
  primary_route: string
  ipo_pct_100: number
  awareness_level: string
}

export async function GET() {
  // Demo renders sample students client-side (no auth in the demo).
  if (!isSupabaseConfigured()) return ok({ students: [], demo: true })

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

    // Access control: must hold a staff role in an organization. Students → 403.
    const { data: memberships } = await supabase
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('profile_id', profile.id)
    const adminMembership = (memberships ?? []).find((m) => isAdminRole(m.role as string))
    if (!adminMembership) return fail('forbidden', 403)

    const { data: orgStudents } = await supabase
      .from('organization_memberships')
      .select('profile_id')
      .eq('organization_id', adminMembership.organization_id)
      .eq('role', 'student')
    const studentIds = (orgStudents ?? []).map((m) => m.profile_id as string)
    if (studentIds.length === 0) return ok({ students: [] })

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, grade_level')
      .in('id', studentIds)

    const { data: results } = await supabase
      .from('assessment_results')
      .select('profile_id, primary_route, ipo_pct_100, awareness_level, created_at')
      .in('profile_id', studentIds)
      .order('created_at', { ascending: false })

    const latest = new Map<string, LatestResult>()
    for (const r of (results ?? []) as LatestResult[]) {
      if (!latest.has(r.profile_id)) latest.set(r.profile_id, r)
    }

    const students = (profiles ?? []).map((p) => {
      const r = latest.get(p.id as string)
      return {
        id: p.id,
        name: p.display_name,
        grade: p.grade_level,
        assessmentCompleted: !!r,
        route: r?.primary_route ?? null,
        readinessPct: r?.ipo_pct_100 ?? null,
        awarenessLevel: r?.awareness_level ?? null,
      }
    })

    return ok({ students })
  } catch {
    return fail('students_failed', 500)
  }
}
