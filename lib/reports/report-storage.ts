/**
 * Cloud Storage helpers for private student reports.
 *
 * Reports live under `reports/{uid}/` in a private bucket. Writes happen ONLY
 * here, server-side via the Admin SDK (Storage rules deny all client writes);
 * reads for the owner go through a short-lived v4 signed URL. Identity always
 * comes from the verified token's uid at the call site — never from the body.
 */
import { getAdminBucket } from '@/lib/firebase/admin'

/** How long a download link stays valid. Short, since it can be re-requested. */
export const SIGNED_URL_TTL_MS = 15 * 60 * 1000 // 15 minutes

export interface StoredReport {
  /** Object path within the bucket, e.g. `reports/<uid>/report-<ts>.pdf`. */
  path: string
  /** Short-lived authorized download URL (v4 signed, read-only). */
  url: string
}

/** Storage object path for a freshly generated report. */
export function reportObjectPath(uid: string, at: number = Date.now()): string {
  // uid comes from a verified Firebase token (safe charset); guard anyway so a
  // surprising value can never escape the user's own prefix.
  const safeUid = uid.replace(/[^A-Za-z0-9_-]/g, '')
  return `reports/${safeUid}/report-${at}.pdf`
}

/**
 * Upload a rendered PDF for `uid` and return its path + a signed read URL.
 * Throws if the bucket is unavailable (caller should fail soft before calling).
 */
export async function uploadReport(uid: string, pdf: Buffer): Promise<StoredReport> {
  const bucket = getAdminBucket()
  if (!bucket) {
    throw new Error('report_bucket_unavailable')
  }

  const path = reportObjectPath(uid)
  const file = bucket.file(path)

  await file.save(pdf, {
    contentType: 'application/pdf',
    resumable: false,
    metadata: {
      contentType: 'application/pdf',
      cacheControl: 'private, max-age=0, no-store',
      metadata: { owner: uid },
    },
  })

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + SIGNED_URL_TTL_MS,
  })

  return { path, url }
}
