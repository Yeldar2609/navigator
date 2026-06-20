'use client'

import * as React from 'react'
import type { User } from 'firebase/auth'
import { onFirebaseAuthChange } from '@/lib/firebase/auth-client'
import {
  fsGetCheckIns,
  fsGetPlan,
  fsGetProfile,
  fsGetResultHistory,
} from '@/lib/firebase/firestore-client'
import { isFirebaseMode } from '@/lib/data/mode'
import { demoStore } from '@/lib/demo/store'

interface AuthState {
  user: User | null
  loading: boolean
  /**
   * True once the post-auth hydration of the local demoStore cache has settled
   * (whether it loaded data, found none, or there was no user to hydrate). Views
   * gate their "empty / take the test" state on this so a cold reload by a
   * returning user never flashes the empty state before Firestore data lands.
   */
  hydrated: boolean
}

const AuthContext = React.createContext<AuthState>({
  user: null,
  loading: true,
  hydrated: false,
})

/**
 * Subscribes to Firebase auth state and, on the first signed-in user, hydrates
 * the local demoStore cache from Firestore so the existing UI (which reads
 * demoStore) reflects the user's persisted data. Each hydration step is guarded
 * so a single failure never throws or blocks the rest.
 */
async function hydrateFromFirestore(uid: string): Promise<void> {
  try {
    const profile = await fsGetProfile(uid)
    if (profile) demoStore.setProfile(profile)
  } catch {
    /* ignore */
  }

  try {
    // Seed the FULL ordered history (oldest → newest) so the retake
    // comparison/timeline works cross-device — not just the latest result.
    const history = await fsGetResultHistory(uid)
    if (history.length) {
      const cached = demoStore.getResultHistory()
      const seen = new Set(cached.map((r) => r.resultId))
      for (const result of history) {
        if (!seen.has(result.resultId)) {
          // addResult appends to history and makes it current; iterating in
          // order leaves the newest result as the current one.
          demoStore.addResult(result)
          seen.add(result.resultId)
        }
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const plan = await fsGetPlan(uid)
    if (plan) demoStore.setPlan(plan)
  } catch {
    /* ignore */
  }

  try {
    await fsGetCheckIns(uid)
  } catch {
    /* ignore */
  }

  // TODO(resume): hydrate assessmentAnswers from Firestore for cross-device resume
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [hydrated, setHydrated] = React.useState(false)
  const hydratedFor = React.useRef<string | null>(null)

  React.useEffect(() => {
    // Demo/preview (no Firebase): onFirebaseAuthChange fires cb(null) once and
    // the local demoStore is the source of truth, so never clear it here — just
    // mark hydrated immediately so pages render against the local cache.
    const firebase = isFirebaseMode()

    const unsubscribe = onFirebaseAuthChange((nextUser) => {
      setUser(nextUser)
      setLoading(false)

      if (!firebase) {
        setHydrated(true)
        return
      }

      if (nextUser) {
        if (hydratedFor.current !== nextUser.uid) {
          hydratedFor.current = nextUser.uid
          // A different (or first) user signed in: drop any previous user's
          // cached data BEFORE hydrating so a shared device never bleeds one
          // student's data into another's session.
          demoStore.reset()
          setHydrated(false)
          void hydrateFromFirestore(nextUser.uid).finally(() => setHydrated(true))
        }
      } else {
        // Signed out: clear local data and mark hydrated (nothing to load).
        hydratedFor.current = null
        demoStore.reset()
        setHydrated(true)
      }
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, hydrated }}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return React.useContext(AuthContext)
}
