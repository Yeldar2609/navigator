// Client-side Firestore persistence for the signed-in user. Mirrors the demoStore
// shape so the data layer can write through to Firestore (collections
// users/{uid}/...) while keeping demoStore as the local cache. Security is
// enforced by firestore.rules (owner-only). No-ops gracefully when unconfigured.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase/client'
import type {
  StoredCheckIn,
  StoredPlan,
  StoredPlanItem,
  StoredProfile,
  StoredResult,
} from '@/lib/data/types'

function userRef(uid: string) {
  const db = getFirebaseDb()
  return db ? doc(db, 'users', uid) : null
}
function sub(uid: string, name: string) {
  const db = getFirebaseDb()
  return db ? collection(db, 'users', uid, name) : null
}

// --- Profile (stored on the user doc) -------------------------------------
export async function fsSaveProfile(uid: string, profile: StoredProfile): Promise<boolean> {
  const ref = userRef(uid)
  if (!ref) return false
  try {
    await setDoc(ref, { profile, updatedAt: serverTimestamp() }, { merge: true })
    return true
  } catch {
    return false
  }
}

export async function fsGetProfile(uid: string): Promise<StoredProfile | null> {
  const ref = userRef(uid)
  if (!ref) return null
  try {
    const snap = await getDoc(ref)
    return snap.exists() ? ((snap.data().profile as StoredProfile) ?? null) : null
  } catch {
    return null
  }
}

// --- Assessment results ----------------------------------------------------
export async function fsAddResult(uid: string, result: StoredResult): Promise<boolean> {
  const col = sub(uid, 'assessmentResults')
  if (!col) return false
  try {
    await setDoc(doc(col, result.resultId), { ...result, _ts: serverTimestamp() })
    return true
  } catch {
    return false
  }
}

export async function fsGetResultHistory(uid: string): Promise<StoredResult[]> {
  const col = sub(uid, 'assessmentResults')
  if (!col) return []
  try {
    const q = query(col, orderBy('createdAt', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as StoredResult)
  } catch {
    return []
  }
}

export async function fsGetLatestResult(uid: string): Promise<StoredResult | null> {
  const col = sub(uid, 'assessmentResults')
  if (!col) return null
  try {
    const q = query(col, orderBy('createdAt', 'desc'), limit(1))
    const snap = await getDocs(q)
    return snap.empty ? null : (snap.docs[0].data() as StoredResult)
  } catch {
    return null
  }
}

// --- Plan (single active plan; keyed by id) --------------------------------
export async function fsSavePlan(uid: string, plan: StoredPlan): Promise<boolean> {
  const col = sub(uid, 'plans')
  if (!col) return false
  try {
    await setDoc(doc(col, plan.id), { ...plan, _ts: serverTimestamp() })
    return true
  } catch {
    return false
  }
}

export async function fsGetPlan(uid: string): Promise<StoredPlan | null> {
  const col = sub(uid, 'plans')
  if (!col) return null
  try {
    const q = query(col, orderBy('createdAt', 'desc'), limit(1))
    const snap = await getDocs(q)
    return snap.empty ? null : (snap.docs[0].data() as StoredPlan)
  } catch {
    return null
  }
}

/** Patch just the items array of an existing plan (per-item status updates). */
export async function fsUpdatePlanItems(
  uid: string,
  planId: string,
  items: StoredPlanItem[],
): Promise<boolean> {
  const db = getFirebaseDb()
  if (!db) return false
  try {
    await updateDoc(doc(db, 'users', uid, 'plans', planId), { items })
    return true
  } catch {
    return false
  }
}

// --- Check-ins -------------------------------------------------------------
export async function fsAddCheckIn(uid: string, entry: StoredCheckIn): Promise<boolean> {
  const col = sub(uid, 'checkIns')
  if (!col) return false
  try {
    await setDoc(doc(col, entry.id), { ...entry, _ts: serverTimestamp() })
    return true
  } catch {
    return false
  }
}

export async function fsGetCheckIns(uid: string): Promise<StoredCheckIn[]> {
  const col = sub(uid, 'checkIns')
  if (!col) return []
  try {
    const q = query(col, orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as StoredCheckIn)
  } catch {
    return []
  }
}

// --- Assessment answers (one doc per session+question) ---------------------
export async function fsSaveAnswer(
  uid: string,
  sessionId: string,
  code: string,
  value: number,
): Promise<boolean> {
  const db = getFirebaseDb()
  if (!db) return false
  try {
    await setDoc(
      doc(db, 'users', uid, 'assessmentAnswers', `${sessionId}_${code}`),
      { sessionId, code, value, updatedAt: serverTimestamp() },
      { merge: true },
    )
    return true
  } catch {
    return false
  }
}
