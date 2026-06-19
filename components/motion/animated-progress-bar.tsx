'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { clamp } from '@/lib/utils/format'

export interface AnimatedProgressBarProps {
  value: number // 0..100
  className?: string
  showLabel?: boolean
}

export function AnimatedProgressBar({ value, className, showLabel = false }: AnimatedProgressBarProps) {
  const reduce = useReducedMotion()
  const pct = clamp(value, 0, 100)
  return (
    <div className={cn('w-full', className)}>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {showLabel ? (
        <p className="mt-1 text-right text-xs text-muted-foreground">{Math.round(pct)}%</p>
      ) : null}
    </div>
  )
}
