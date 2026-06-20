/**
 * POST /api/admin/students/[uid]/delete — soft-archive a student's history.
 *
 * AUTH MODEL: requireAdmin() (custom claim) → 403 if not. The ACTOR is the
 * verified admin (admin.uid); the SUBJECT is the path uid. A uid in the body is
 * never trusted for the subject.
 *
 * BEHAVIOR (privacy-preserving, reversible): we SOFT-ARCHIVE rather than
 * hard-delete — set users/{uid}.archived = true with archivedAt / archivedBy.
 * No student documents are destroyed, so the action is auditable and reversible.
 *
 * ALWAYS writes a server-only audit record to `auditLogs`:
 *   { adminUid, targetUid, action:'delete_history', scope:'archive', at }
 *
 * Requires an explicit { confirm: true } in the JSON body.
 */
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdmin } from '@/lib/admin/access'
import { getAdminDb } from '@/lib/firebase/admin'
import { isFirebaseAdminConfigured } from '@/lib/env'
import { fail, ok } from '@/lib/utils/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { uid: string } }) {
  const admin = await requireAdmin(request)
  if (!admin) return fail('forbidden', 403)

  if (!isFirebaseAdminConfigured()) return fail('admin_unavailable', 503)
  const db = getAdminDb()
  if (!db) return fail('admin_unavailable', 503)

  const targetUid = (params.uid || '').trim()
  if (!targetUid || targetUid.length > 128 || /[^A-Za-z0-9_-]/.test(targetUid)) {
    return fail('invalid_uid', 400)
  }

  // Require an explicit confirm flag — guards against accidental/CSRF-style calls.
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('invalid_json', 400)
  }
  if (!body || typeof body !== 'object' || (body as { confirm?: unknown }).confirm !== true) {
    return fail('confirmation_required', 422)
  }

  try {
    const userRef = db.collection('users').doc(targetUid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) return fail('not_found', 404)

    const scope = 'archive'

    // Soft archive: flag the user doc. Reversible; no history is destroyed.
    await userRef.set(
      {
        archived: true,
        archivedAt: FieldValue.serverTimestamp(),
        archivedBy: admin.uid,
      },
      { merge: true },
    )

    // ALWAYS write an immutable audit record (server-only collection).
    await db.collection('auditLogs').add({
      adminUid: admin.uid,
      targetUid,
      action: 'delete_history',
      scope,
      at: FieldValue.serverTimestamp(),
    })

    return ok({ archived: true, scope })
  } catch {
    return fail('delete_failed', 500)
  }
}
