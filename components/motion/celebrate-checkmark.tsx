'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/** A spring-in checkmark for small completion celebrations. */
export function CelebrateCheckmark({ className, size = 64 }: { className?: string; size?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={cn('flex items-center justify-center rounded-full bg-success text-success-foreground', className)}
      style={{ width: size, height: size }}
      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 16 }}
    >
      <motion.span
        initial={reduce ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 14 }}
      >
        <Check style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={3} />
      </motion.span>
    </motion.div>
  )
}
