/**
 * Cloud Storage helpers for private student reports.
 *
 * Reports are returned to the caller as PDF bytes directly; we ALSO best-effort
 * archive a copy under `reports/{uid}/` in a private bucket (writes happen only
 * here, server-side via the Admin SDK; Storage rules deny all client writes).
 * Archiving must never break the download, so it swallows every error — a
 * missing bucket or a failed write just means no archived copy. Identity always
 * comes from the verified token's uid at the call site — never from the body.
 */
import { getAdminBucket } from '@/lib/firebase/admin'

/** Storage object path for a freshly generated report. */
export function reportObjectPath(uid: string, at: number = Date.now()): string {
  // uid comes from a verified Firebase token (safe charset); guard anyway so a
  // surprising value can never escape the user's own prefix.
  const safeUid = uid.replace(/[^A-Za-z0-9_-]/g, '')
  return `reports/${safeUid}/report-${at}.pdf`
}

/**
 * Best-effort archive of a rendered PDF for `uid` under their own prefix.
 *
 * NEVER throws: a missing bucket (e.g. App Hosting without a configured bucket)
 * or a write failure must not break the download path. The PDF bytes are
 * returned to the caller regardless of whether this succeeds.
 */
export async function archiveReport(uid: string, pdf: Buffer): Promise<void> {
  try {
    const bucket = getAdminBucket()
    if (!bucket) return

    const path = reportObjectPath(uid)
    await bucket.file(path).save(pdf, {
      contentType: 'application/pdf',
      resumable: false,
      metadata: {
        contentType: 'application/pdf',
        cacheControl: 'private, max-age=0, no-store',
        metadata: { owner: uid },
      },
    })
  } catch {
    // Archiving is optional — swallow so the download never fails.
  }
}
