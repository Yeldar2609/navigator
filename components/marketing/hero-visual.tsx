import type { Messages } from '@/lib/i18n/dictionaries'

/**
 * Hero right column — pure-CSS red+blue duotone composition ported verbatim from
 * variant-BG.html (G-style split hero): overlapping blobs, diagonal accents, the
 * 3-node dashed route path, and the frosted glass result card. Decorative
 * (aria-hidden); only the two glass-card strings come from i18n.
 */
export function HeroVisual({ dict }: { dict: Messages }) {
  const v = dict.landing.hero.visual
  return (
    <div className="visual" aria-hidden="true">
      <div className="blob blue" />
      <div className="blob red" />
      <div className="blob soft" />
      <div className="diag one" />
      <div className="diag two" />

      <div className="route">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
          <path
            d="M18,24 C40,30 30,52 50,50 C72,48 64,78 84,80"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="0.5 5"
            opacity="0.85"
          />
        </svg>
        <div className="node n1">
          <span className="pin" />
        </div>
        <div className="node n2">
          <span className="pin" />
        </div>
        <div className="node n3">
          <span className="pin" />
        </div>
      </div>

      <div className="glass">
        <span className="av" />
        <div className="gt">
          <b>{v.cardTitle}</b>
          <span>{v.cardSubtitle}</span>
        </div>
        <span className="prog">100%</span>
      </div>
    </div>
  )
}
