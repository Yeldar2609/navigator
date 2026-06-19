import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { clamp } from '@/lib/utils/format'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0..100
}

/** Static progress track. For the animated variant see components/motion. */
export function Progress({ value, className, ...props }: ProgressProps) {
  const pct = clamp(value, 0, 100)
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
