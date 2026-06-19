'use client'

import * as React from 'react'
import type { Messages } from '@/lib/i18n/dictionaries'
import { PLAN_HORIZONS } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'

export function HorizonPicker({ dict }: { dict: Messages }) {
  const [selected, setSelected] = React.useState<number>(3)
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{dict.plan.chooseHorizon}</p>
      <div className="flex flex-wrap gap-2">
        {PLAN_HORIZONS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setSelected(h)}
            aria-pressed={selected === h}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95',
              selected === h
                ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                : 'border-border hover:bg-muted',
            )}
          >
            {dict.plan.horizon[h]}
          </button>
        ))}
      </div>
    </div>
  )
}
