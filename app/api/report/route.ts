/**
 * POST /api/report — server-side PDF report generation.
 *
 * Flow: verify the Firebase ID token → fail soft (503) if Admin is unconfigured
 * → validate the derived report payload → render a PDF with @react-pdf/renderer
 * → upload privately to `reports/{uid}/` → return a short-lived signed URL.
 *
 * Identity is taken ONLY from the verified token (`user.uid`); a uid in the body
 * is never trusted. The payload carries derived results only (no chats, no raw
 * answers) — privacy is enforced upstream by what the client sends and here by
 * the schema, which has no field for them.
 */
import { z } from 'zod'
import { getAuthedUser } from '@/lib/firebase/admin'
import { isFirebaseAdminConfigured } from '@/lib/env'
import { uploadReport } from '@/lib/reports/report-storage'
import { fail, ok } from '@/lib/utils/api'
import type { ReportData } from '@/lib/reports/pdf-document'

// PDF rendering needs Node APIs (streams/buffers) — not the Edge runtime.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const strList = z.array(z.string().max(400)).max(40)

const labelsSchema = z.object({
  reportTitle: z.string().max(200),
  preparedFor: z.string().max(200),
  generatedOn: z.string().max(200),
  readinessScore: z.string().max(200),
  internalScoreDetail: z.string().max(400),
  yourDirection: z.string().max(200),
  yourClusters: z.string().max(200),
  yourQualities: z.string().max(200),
  motivationWorkStyle: z.string().max(200),
  yourStrengths: z.string().max(200),
  areasToGrow: z.string().max(200),
  recommendedCareers: z.string().max(200),
  recommendedMajors: z.string().max(200),
  subjectsToFocus: z.string().max(200),
  projectIdeas: z.string().max(200),
  universitiesToExplore: z.string().max(200),
  yourPlan: z.string().max(200),
  methodology: z.string().max(200),
  dataSources: z.string().max(200),
  disclaimerHeading: z.string().max(200),
  none: z.string().max(200),
})

const reportSchema = z.object({
  appName: z.string().max(120),
  studentName: z.string().max(200),
  gradeLabel: z.string().max(120).optional(),
  date: z.string().max(120),
  route: z.string().max(200),
  routeDescription: z.string().max(600).optional(),
  clusters: strList,
  qualities: strList,
  motivationProfile: z.string().max(800),
  score0to100: z.number().min(0).max(100),
  score0to60: z.number().min(0).max(60),
  awarenessLabel: z.string().max(200).optional(),
  strengths: strList,
  growthAreas: strList,
  careers: strList,
  majors: strList,
  subjects: strList,
  projects: strList,
  universities: strList,
  planSummary: z.string().max(2000),
  methodologyVersion: z.string().max(300),
  dataSourceNote: z.string().max(1000),
  disclaimer: z.string().max(1500),
  labels: labelsSchema,
})

export async function POST(request: Request) {
  // 1. Authenticate. Identity is derived solely from the verified token.
  const user = await getAuthedUser(request)
  if (!user) return fail('unauthorized', 401)

  // 2. Fail soft when the Admin SDK / Storage isn't configured (e.g. local dev
  //    without ADC). The feature is optional; never 500 here.
  if (!isFirebaseAdminConfigured()) {
    return fail('reports_unavailable', 503)
  }

  // 3. Validate the derived payload (no chats / raw answers in the schema).
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return fail('invalid_json', 400)
  }
  const parsed = reportSchema.safeParse(raw)
  if (!parsed.success) {
    return fail('invalid_report_data', 422, { issues: parsed.error.issues })
  }
  const data: ReportData = parsed.data

  try {
    // 4. Render the PDF to a Buffer. Import lazily so the heavy renderer never
    //    loads on unrelated requests / during module init.
    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { reportDocument } = await import('@/lib/reports/pdf-document')
    const pdf = await renderToBuffer(reportDocument(data))

    // 5. Upload privately under the caller's own prefix, then sign a read URL.
    const { url } = await uploadReport(user.uid, Buffer.from(pdf))
    return ok({ url })
  } catch {
    return fail('report_generation_failed', 500)
  }
}
