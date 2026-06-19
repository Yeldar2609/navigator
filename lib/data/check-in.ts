import { demoStore } from '@/lib/demo/store'
import { isDemoMode } from './mode'
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
 * Record a check-in. Demo mode persists locally; configured mode also fires the
 * server route (server resolves the profile + links the student's own plan).
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

  if (!isDemoMode()) {
    try {
      await fetch('/api/check-ins/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          moodScore: entry.mood,
          confidenceScore: entry.confidence,
          effortScore: entry.effort,
          blocker: entry.blocker,
          note: entry.note,
        }),
      })
    } catch {
      /* ignore — local entry already shown */
    }
  }
  return entry
}
