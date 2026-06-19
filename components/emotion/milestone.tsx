'use client'

import type { ReactNode } from 'react'
import { CelebrateCheckmark } from '@/components/motion/celebrate-checkmark'
import { cn } from '@/lib/utils/cn'

/** A bigger celebration for a real milestone (finishing a month, a streak). */
export function Milestone({
  title,
  body,
  action,
  className,
}: {
  title: string
  body?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br from-success/10 to-card p-6 text-center shadow-soft',
        className,
      )}
    >
      <div className="flex justify-center">
        <CelebrateCheckmark />
      </div>
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      {body ? <p className="mt-1 text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
