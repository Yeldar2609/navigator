'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Compass, HeartHandshake, Sparkles, Target } from 'lucide-react'

const ITEMS = [
  { Icon: Compass, position: 'left-[6%] top-[24%]', tone: 'text-primary', delay: 0 },
  { Icon: Target, position: 'right-[8%] top-[18%]', tone: 'text-accent', delay: 0.4 },
  { Icon: Sparkles, position: 'left-[13%] bottom-[14%]', tone: 'text-success', delay: 0.8 },
  { Icon: HeartHandshake, position: 'right-[11%] bottom-[20%]', tone: 'text-primary', delay: 0.2 },
]

/** Decorative soft cards that drift behind the hero. Purely ornamental. */
export function FloatingCards() {
  const reduce = useReducedMotion()
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      {ITEMS.map(({ Icon, position, tone, delay }, i) => (
        <motion.div
          key={i}
          className={`absolute ${position}`}
          animate={reduce ? undefined : { y: [0, -12, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card/80 shadow-soft backdrop-blur">
            <Icon className={`h-5 w-5 ${tone}`} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
