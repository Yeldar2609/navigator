/**
 * GET /api/admin/students/export — CSV roster export.
 *
 * Same auth model as the list route: requireAdmin() (custom claim) → 403 if not.
 * Fails soft → 503 when Admin is unconfigured. Emits ONLY the derived,
 * privacy-safe columns — no chats, no raw answers.
 */
import { requireAdmin } from '@/lib/admin/access'
import { getAdminDb } from '@/lib/firebase/admin'
import { isFirebaseAdminConfigured } from '@/lib/env'
import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { fail } from '@/lib/utils/api'
import { listStudentRows } from '@/app/api/admin/_lib/student-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** RFC-4180 style escaping: wrap in quotes and double embedded quotes. */
function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request)
  if (!admin) return fail('forbidden', 403)

  if (!isFirebaseAdminConfigured()) return fail('admin_unavailable', 503)
  const db = getAdminDb()
  if (!db) return fail('admin_unavailable', 503)

  try {
    const locale = resolveLocale(new URL(request.url).searchParams.get('lang'))
    const dict = getDictionary(locale)
    const a = dict.d4.admin
    const rows = await listStudentRows(db, locale, dict)

    const header = [
      a.csvName,
      a.csvGrade,
      a.csvRoute,
      a.csvSecondaryRoute,
      a.csvScore,
      a.csvClarity,
      a.csvPlanProgress,
      a.csvLastCheckIn,
      a.csvRecommendedCareers,
    ]

    const lines = [header.map(csvCell).join(',')]
    for (const r of rows) {
      lines.push(
        [
          csvCell(r.name),
          csvCell(r.grade ?? ''),
          csvCell(r.route ?? a.notStarted),
          csvCell(r.secondaryRoute ?? ''),
          csvCell(r.score ?? ''),
          csvCell(r.clarity ?? ''),
          csvCell(r.planTotal > 0 ? `${r.planDone}/${r.planTotal}` : ''),
          csvCell(r.lastCheckIn ?? a.noCheckIn),
          csvCell(r.recommendedCareers.join('; ')),
        ].join(','),
      )
    }

    // Prepend a UTF-8 BOM so Excel reads Cyrillic/Kazakh correctly.
    const csv = '﻿' + lines.join('\r\n') + '\r\n'
    const filename = `students-${new Date().toISOString().slice(0, 10)}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return fail('export_failed', 500)
  }
}
