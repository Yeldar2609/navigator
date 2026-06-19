'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

/** A small, fleeting "nice — that counts" acknowledgement after a completed step. */
export function SmallWin({ show, label }: { show: boolean; label: string }) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {show ? (
        <motion.span
          initial={reduce ? false : { opacity: 0, scale: 0.9, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="inline-flex items-center gap-1 text-xs font-medium text-success"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {label}
        </motion.span>
      ) : null}
    </AnimatePresence>
  )
}
