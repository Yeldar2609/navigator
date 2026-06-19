'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/** A gentle, supportive line that reassures the student. Message comes from the
 *  caller so it can be locale-aware and context-specific (no childish tone). */
export function ConfidenceBoost({ message, className }: { message: string; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-soft/60 p-4',
        className,
      )}
      role="note"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-primary">
        <Heart className="h-4 w-4" />
      </span>
      <p className="text-sm text-foreground/90">{message}</p>
    </motion.div>
  )
}
