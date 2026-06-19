import { demoStore } from '@/lib/demo/store'
import { getCurrentUid } from '@/lib/firebase/client'
import { fsAddCheckIn } from '@/lib/firebase/firestore-client'
import { isFirebaseMode } from './mode'
import type { StoredCheckIn } from './types'

export interface CheckInInput {
  mood: number
  confidence: number
  effort: number
  blocker?: string
  note?: string
}

/** Local check-in history (newest first). The local store is the UI source. */
export function getCheckIns(): StoredCheckIn[] {
  return demoStore.getCheckIns()
}

/**
 * Record a check-in. Always persists locally; in Firebase mode it also writes
 * to Firestore under users/{uid}/checkIns (best-effort).
 */
export async function createCheckIn(input: CheckInInput): Promise<StoredCheckIn> {
  const entry: StoredCheckIn = {
    id: demoStore.newId(),
    createdAt: new Date().toISOString(),
    mood: input.mood,
    confidence: input.confidence,
    effort: input.effort,
    blocker: input.blocker?.trim() || undefined,
    note: input.note?.trim() || undefined,
  }
  demoStore.addCheckIn(entry)

  if (isFirebaseMode()) {
    const uid = getCurrentUid()
    if (uid) {
      try {
        await fsAddCheckIn(uid, entry)
      } catch {
        /* ignore — local entry already shown */
      }
    }
  }
  return entry
}
