'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function Chip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground shadow-soft'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted',
        className,
      )}
    >
      {selected ? <Check className="h-3.5 w-3.5" /> : null}
      {children}
    </motion.button>
  )
}
