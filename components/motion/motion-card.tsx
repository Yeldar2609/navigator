'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface MotionCardProps extends HTMLMotionProps<'div'> {
  /** Stagger delay in seconds (use incrementally for a reveal sequence). */
  delay?: number
}

/** Card that fades up into view and lifts gently on hover. Honors reduced motion. */
export function MotionCard({ className, delay = 0, children, ...props }: MotionCardProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -4 }}
      className={cn('rounded-2xl border bg-card text-card-foreground shadow-soft', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
