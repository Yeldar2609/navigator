'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'

export interface PulseSavedIndicatorProps {
  show: boolean
  label: string
}

/** Briefly shows a "Saved" pill after an answer/field is persisted. */
export function PulseSavedIndicator({ show, label }: PulseSavedIndicatorProps) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {show ? (
        <motion.span
          key="saved"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1 text-xs font-medium text-success"
        >
          <Check className="h-3.5 w-3.5" />
          {label}
        </motion.span>
      ) : null}
    </AnimatePresence>
  )
}
