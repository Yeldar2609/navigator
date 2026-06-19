// DEV-only demo persistence: a single localStorage blob holding the demo user,
// profile, assessment session, result, and plan. No secrets are ever stored
// here (no service-role key, no tokens) — it only exists when Supabase is not
// configured. See lib/data/mode.ts and docs/DAY_2_NOTES.md.

import type {
  DemoUser,
  StoredChatThread,
  StoredCheckIn,
  StoredPlan,
  StoredPlanItem,
  StoredProfile,
  StoredResult,
} from '@/lib/data/types'

const KEY = 'navigator_demo_v1'

interface DemoState {
  user: DemoUser | null
  profile: StoredProfile | null
  session: { id: string; answers: Record<string, number>; startedAt: string } | null
  result: StoredResult | null
  resultHistory: StoredResult[]
  plan: StoredPlan | null
  checkIns: StoredCheckIn[]
  chatThread: StoredChatThread | null
}

const EMPTY: DemoState = {
  user: null,
  profile: null,
  session: null,
  result: null,
  resultHistory: [],
  plan: null,
  checkIns: [],
  chatThread: null,
}

function read(): DemoState {
  if (typeof window === 'undefined') return { ...EMPTY }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<DemoState>) }
  } catch {
    return { ...EMPTY }
  }
}

function write(state: DemoState): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    /* storage full / unavailable (private mode, disabled storage) */
    return false
  }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `demo-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export const demoStore = {
  // --- user ---
  getUser(): DemoUser | null {
    return read().user
  },
  signIn(email: string): DemoUser {
    const state = read()
    const next: DemoUser = { ...(state.user ?? { id: uuid(), email }), email }
    write({ ...state, user: next })
    return next
  },
  signOut(): void {
    write({ ...EMPTY })
  },

  // --- profile ---
  getProfile(): StoredProfile | null {
    return read().profile
  },
  setProfile(profile: StoredProfile): boolean {
    return write({ ...read(), profile })
  },

  // --- assessment session ---
  ensureSession(): string {
    const state = read()
    if (state.session) return state.session.id
    const id = uuid()
    write({ ...state, session: { id, answers: {}, startedAt: new Date().toISOString() } })
    return id
  },
  getAnswers(): Record<string, number> {
    return read().session?.answers ?? {}
  },
  /** Start a fresh session (used by "Retake assessment" — clears prior answers). */
  resetSession(): void {
    write({
      ...read(),
      session: { id: uuid(), answers: {}, startedAt: new Date().toISOString() },
    })
  },
  saveAnswer(code: string, value: number): { answeredCount: number } {
    const state = read()
    const session = state.session ?? {
      id: uuid(),
      answers: {},
      startedAt: new Date().toISOString(),
    }
    session.answers = { ...session.answers, [code]: value }
    write({ ...state, session })
    return { answeredCount: Object.keys(session.answers).length }
  },

  // --- result ---
  getResult(): StoredResult | null {
    return read().result
  },
  getResultHistory(): StoredResult[] {
    return read().resultHistory ?? []
  },
  /** Append a NEW attempt to history and make it current (submit / retake). */
  addResult(result: StoredResult): void {
    const state = read()
    write({ ...state, result, resultHistory: [...(state.resultHistory ?? []), result] })
  },
  /** Update the CURRENT attempt in place (e.g. plan re-score) — history length stays. */
  setResult(result: StoredResult): void {
    const state = read()
    const resultHistory = (state.resultHistory ?? []).map((r) =>
      r.resultId === result.resultId ? result : r,
    )
    write({ ...state, result, resultHistory })
  },

  // --- plan ---
  getPlan(): StoredPlan | null {
    return read().plan
  },
  setPlan(plan: StoredPlan): void {
    write({ ...read(), plan })
  },
  updatePlanItem(itemId: string, patch: Partial<StoredPlanItem>): StoredPlan | null {
    const state = read()
    if (!state.plan) return null
    const items = state.plan.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it))
    const plan = { ...state.plan, items }
    write({ ...state, plan })
    return plan
  },

  // --- check-ins ---
  getCheckIns(): StoredCheckIn[] {
    return read().checkIns ?? []
  },
  addCheckIn(entry: StoredCheckIn): StoredCheckIn {
    const state = read()
    write({ ...state, checkIns: [entry, ...(state.checkIns ?? [])] })
    return entry
  },

  // --- chat ---
  getChatThread(): StoredChatThread | null {
    return read().chatThread ?? null
  },
  setChatThread(thread: StoredChatThread): void {
    write({ ...read(), chatThread: thread })
  },

  reset(): void {
    write({ ...EMPTY })
  },

  newId: uuid,
}
