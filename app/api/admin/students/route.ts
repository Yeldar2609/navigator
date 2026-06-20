/**
 * GET /api/admin/students — Firebase-backed admin roster.
 *
 * AUTH MODEL: requireAdmin() verifies the Firebase ID token AND that it carries
 * the `admin: true` custom claim. No admin → 403. Identity/claim come only from
 * the verified token; the body/query are never trusted.
 *
 * Fails SOFT: if the Admin SDK is unconfigured (e.g. local dev without ADC) we
 * return 503 {error:'admin_unavailable'} instead of 500.
 *
 * Returns DERIVED, privacy-safe rows only (see _lib/student-data). NEVER chats
 * or raw assessment answers.
 */
import { requireAdmin } from '@/lib/admin/access'
import { getAdminDb } from '@/lib/firebase/admin'
import { isFirebaseAdminConfigured } from '@/lib/env'
import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { fail, ok } from '@/lib/utils/api'
import { listStudentRows } from '@/app/api/admin/_lib/student-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // 1. Authorize via custom claim FIRST.
  const admin = await requireAdmin(request)
  if (!admin) return fail('forbidden', 403)

  // 2. Fail soft when admin credentials are absent.
  if (!isFirebaseAdminConfigured()) return fail('admin_unavailable', 503)

  const db = getAdminDb()
  if (!db) return fail('admin_unavailable', 503)

  try {
    const locale = resolveLocale(new URL(request.url).searchParams.get('lang'))
    const dict = getDictionary(locale)
    const students = await listStudentRows(db, locale, dict)
    return ok({ students })
  } catch {
    return fail('students_failed', 500)
  }
}
