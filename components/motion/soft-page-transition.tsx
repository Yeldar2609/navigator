'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/** Gentle fade/slide-in wrapper for page content. */
export function SoftPageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
