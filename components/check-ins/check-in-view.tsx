'use client'

import * as React from 'react'
import { Activity, Sparkles } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { createCheckIn, getCheckIns } from '@/lib/data/check-in'
import type { StoredCheckIn } from '@/lib/data/types'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { MotionCard } from '@/components/motion/motion-card'
import { PulseSavedIndicator } from '@/components/motion/pulse-saved-indicator'
import { cn } from '@/lib/utils/cn'

function Scale({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={value === v}
            className={cn(
              'rounded-xl border py-2 text-sm font-medium transition-all active:scale-95',
              value === v
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted',
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

export function CheckInView({ locale, dict }: { locale: Locale; dict: Messages }) {
  const t = dict.checkIns
  const [history, setHistory] = React.useState<StoredCheckIn[]>([])
  const [mood, setMood] = React.useState(3)
  const [confidence, setConfidence] = React.useState(3)
  const [effort, setEffort] = React.useState(3)
  const [note, setNote] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [reward, setReward] = React.useState(false)
  const rewardTimer = React.useRef<number | null>(null)

  React.useEffect(() => {
    setHistory(getCheckIns())
  }, [])

  React.useEffect(
    () => () => {
      if (rewardTimer.current) window.clearTimeout(rewardTimer.current)
    },
    [],
  )

  async function save() {
    if (saving) return
    setSaving(true)
    const entry = await createCheckIn({ mood, confidence, effort, note })
    setHistory((prev) => [entry, ...prev])
    setNote('')
    setReward(true)
    if (rewardTimer.current) window.clearTimeout(rewardTimer.current)
    rewardTimer.current = window.setTimeout(() => setReward(false), 2500)
    setSaving(false)
  }

  const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const metrics = (e: StoredCheckIn) => [
    { label: t.mood, value: e.mood },
    { label: t.confidence, value: e.confidence },
    { label: t.effort, value: e.effort },
  ]

  return (
    <div className="space-y-6">
      <MotionCard delay={0} className="p-6">
        <div className="space-y-5">
          <Scale label={t.mood} value={mood} onChange={setMood} />
          <Scale label={t.confidence} value={confidence} onChange={setConfidence} />
          <Scale label={t.effort} value={effort} onChange={setEffort} />
          <div>
            <p className="mb-1.5 text-sm font-medium">{t.note}</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.notePlaceholder}
              rows={2}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={save} disabled={saving}>
              {t.submit}
            </Button>
            <PulseSavedIndicator show={reward} label={dict.common.saved} />
            {reward ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                <Sparkles className="h-4 w-4" />
                {t.reward}
              </span>
            ) : null}
          </div>
        </div>
      </MotionCard>

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t.historyTitle}</h2>
        {history.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-6 w-6" />}
            title={t.empty.title}
            description={t.empty.body}
          />
        ) : (
          <ul className="space-y-3">
            {history.map((e) => (
              <li key={e.id} className="rounded-2xl border bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dateFmt.format(new Date(e.createdAt))}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {metrics(e).map((m) => (
                      <span
                        key={m.label}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {m.label} {m.value}/5
                      </span>
                    ))}
                  </div>
                </div>
                {e.note ? <p className="mt-2 text-sm text-muted-foreground">{e.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
