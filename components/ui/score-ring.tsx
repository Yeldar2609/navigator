'use client'

import { motion, useReducedMotion } from 'framer-motion'

/** Animated circular progress ring for the Career Readiness score (0–100). */
export function ScoreRing({
  value,
  label,
  size = 168,
}: {
  value: number
  label?: string
  size?: number
}) {
  const reduce = useReducedMotion()
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, value))
  const offset = circumference * (1 - pct / 100)

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(pct)} / 100${label ? ` — ${label}` : ''}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreRingGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="scoreRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        aria-hidden="true"
      >
        <span className="text-4xl font-bold tabular-nums">{Math.round(pct)}</span>
        {label ? (
          <span className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</span>
        ) : null}
      </div>
    </div>
  )
}
