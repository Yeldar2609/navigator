// SERVER-ONLY. Firestore data access via the Admin SDK — the Firebase backend
// behind the lib/data/* abstraction. Each function is keyed by the VERIFIED uid
// (from getAuthedUser); client-supplied ids are never trusted. Returns null/false
// when admin credentials are absent so callers can fall back (dev) — production
// fails closed via assertProductionEnv() at the route entry.
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import type {
  StoredProfile,
  StoredResult,
  StoredPlan,
  StoredCheckIn,
  StoredChatMessage,
} from '@/lib/data/types'

function userDoc(uid: string) {
  const db = getAdminDb()
  return db ? db.collection('users').doc(uid) : null
}

// --- Profile ---------------------------------------------------------------
export async function saveProfile(uid: string, profile: StoredProfile): Promise<boolean> {
  const ref = userDoc(uid)
  if (!ref) return false
  await ref.set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  return true
}

export async function getProfile(uid: string): Promise<StoredProfile | null> {
  const ref = userDoc(uid)
  if (!ref) return null
  const snap = await ref.get()
  return snap.exists ? (snap.data() as StoredProfile) : null
}

// --- Assessment results (server-written; rules forbid client writes) -------
export async function saveResult(uid: string, result: StoredResult): Promise<boolean> {
  const ref = userDoc(uid)
  if (!ref) return false
  await ref
    .collection('assessmentResults')
    .doc(result.resultId)
    .set({ ...result, createdAt: result.createdAt ?? FieldValue.serverTimestamp() })
  return true
}

export async function getLatestResult(uid: string): Promise<StoredResult | null> {
  const ref = userDoc(uid)
  if (!ref) return null
  const q = await ref.collection('assessmentResults').orderBy('createdAt', 'desc').limit(1).get()
  return q.empty ? null : (q.docs[0].data() as StoredResult)
}

// --- Plans -----------------------------------------------------------------
export async function savePlan(uid: string, plan: StoredPlan): Promise<boolean> {
  const ref = userDoc(uid)
  if (!ref) return false
  await ref.collection('plans').doc(plan.id).set(plan)
  return true
}

export async function getActivePlan(uid: string): Promise<StoredPlan | null> {
  const ref = userDoc(uid)
  if (!ref) return null
  const q = await ref.collection('plans').orderBy('createdAt', 'desc').limit(1).get()
  return q.empty ? null : (q.docs[0].data() as StoredPlan)
}

// --- Check-ins -------------------------------------------------------------
export async function saveCheckIn(uid: string, checkIn: StoredCheckIn): Promise<boolean> {
  const ref = userDoc(uid)
  if (!ref) return false
  await ref.collection('checkIns').doc(checkIn.id).set(checkIn)
  return true
}

export async function listCheckIns(uid: string, max = 5): Promise<StoredCheckIn[]> {
  const ref = userDoc(uid)
  if (!ref) return []
  const q = await ref.collection('checkIns').orderBy('createdAt', 'desc').limit(max).get()
  return q.docs.map((d) => d.data() as StoredCheckIn)
}

// --- Chat (private to the owner; never admin-visible / exportable) ---------
export async function appendChatMessage(
  uid: string,
  threadId: string,
  message: StoredChatMessage,
  aiMeta?: Record<string, unknown>,
): Promise<boolean> {
  const ref = userDoc(uid)
  if (!ref) return false
  const thread = ref.collection('chatThreads').doc(threadId)
  await thread.set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  await thread.collection('messages').doc(message.id).set({ ...message, aiMeta: aiMeta ?? null })
  return true
}

// --- Internal analytics (server-only collection) ---------------------------
export type AnalyticsEvent =
  | 'signup'
  | 'onboarding_complete'
  | 'assessment_started'
  | 'assessment_submitted'
  | 'results_viewed'
  | 'plan_generated'
  | 'chat_sent'
  | 'checkin_submitted'
  | 'report_exported'

export async function logAnalyticsEvent(
  uid: string,
  type: AnalyticsEvent,
  props?: Record<string, unknown>,
): Promise<void> {
  const db = getAdminDb()
  if (!db) return
  await db.collection('analyticsEvents').add({
    uid,
    type,
    props: props ?? {},
    at: FieldValue.serverTimestamp(),
  })
}
