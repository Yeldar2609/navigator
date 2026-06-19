'use client'

import * as React from 'react'
import type { User } from 'firebase/auth'
import { onFirebaseAuthChange } from '@/lib/firebase/auth-client'
import {
  fsGetCheckIns,
  fsGetLatestResult,
  fsGetPlan,
  fsGetProfile,
} from '@/lib/firebase/firestore-client'
import { demoStore } from '@/lib/demo/store'

interface AuthState {
  user: User | null
  loading: boolean
}

const AuthContext = React.createContext<AuthState>({ user: null, loading: true })

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
    const latest = await fsGetLatestResult(uid)
    if (latest) {
      const cached = demoStore.getResultHistory()
      if (!cached.some((r) => r.resultId === latest.resultId)) {
        demoStore.addResult(latest)
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
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const hydratedFor = React.useRef<string | null>(null)

  React.useEffect(() => {
    const unsubscribe = onFirebaseAuthChange((nextUser) => {
      setUser(nextUser)
      setLoading(false)
      if (nextUser && hydratedFor.current !== nextUser.uid) {
        hydratedFor.current = nextUser.uid
        void hydrateFromFirestore(nextUser.uid)
      }
    })
    return unsubscribe
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return React.useContext(AuthContext)
}
