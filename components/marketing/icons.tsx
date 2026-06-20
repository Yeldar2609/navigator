/**
 * Decorative inline SVGs ported verbatim from variant-BG.html. All are
 * aria-hidden ornamentation; sizing comes from the scoped landing CSS.
 */
import type { SVGProps } from 'react'

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'aria-hidden': true,
} as const

export function IconArrow() {
  return <span className="arrow">→</span>
}

export function IconCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={3.5} {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function IconLayers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M5 8l7-5 7 5" />
      <path d="M2 12h20" />
      <path d="M5 16l7 5 7-5" />
    </svg>
  )
}

export function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

export function IconTarget(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

export function IconClipboard(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

export function IconTrend(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  )
}
