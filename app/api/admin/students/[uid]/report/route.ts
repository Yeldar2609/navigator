/**
 * GET /api/admin/students/[uid]/report — admin-generated student PDF.
 *
 * AUTH MODEL: requireAdmin() (custom claim) → 403 if not. An authorized admin
 * may generate the report for ANY target uid (route param), so identity here is
 * split: the ACTOR is the verified admin; the SUBJECT is the path uid (used only
 * to read that student's own Firestore docs and store under their own prefix).
 *
 * Reuses the student report pipeline: buildAdminReportData() → reportDocument()
 * → uploadReport(). Contains NO chats / raw answers (the ReportData shape has no
 * field for them). Returns a short-lived signed URL.
 *
 * Fails soft → 503 when Admin is unconfigured; 404 if the student has no result.
 */
import { requireAdmin } from '@/lib/admin/access'
import { getAdminDb } from '@/lib/firebase/admin'
import { isFirebaseAdminConfigured } from '@/lib/env'
import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { uploadReport } from '@/lib/reports/report-storage'
import { fail, ok } from '@/lib/utils/api'
import { buildAdminReportData } from '@/app/api/admin/_lib/student-data'

// PDF rendering needs Node APIs (streams/buffers) — not the Edge runtime.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  const admin = await requireAdmin(request)
  if (!admin) return fail('forbidden', 403)

  if (!isFirebaseAdminConfigured()) return fail('admin_unavailable', 503)
  const db = getAdminDb()
  if (!db) return fail('admin_unavailable', 503)

  // The subject is the path uid. Sanitize defensively before any read/write.
  const targetUid = (params.uid || '').trim()
  if (!targetUid || targetUid.length > 128 || /[^A-Za-z0-9_-]/.test(targetUid)) {
    return fail('invalid_uid', 400)
  }

  try {
    const userSnap = await db.collection('users').doc(targetUid).get()
    if (!userSnap.exists) return fail('not_found', 404)

    const locale = resolveLocale(new URL(request.url).searchParams.get('lang'))
    const dict = getDictionary(locale)
    const data = await buildAdminReportData(
      db,
      targetUid,
      userSnap.data() as Record<string, unknown>,
      locale,
      dict,
    )
    if (!data) return fail('no_result', 404)

    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { reportDocument } = await import('@/lib/reports/pdf-document')
    const pdf = await renderToBuffer(reportDocument(data))

    // Store under the STUDENT's own prefix (reports/{targetUid}/...).
    const { url } = await uploadReport(targetUid, Buffer.from(pdf))
    return ok({ url })
  } catch {
    return fail('report_generation_failed', 500)
  }
}
