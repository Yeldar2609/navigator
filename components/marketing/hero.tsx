import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { HeroVisual } from './hero-visual'
import { IconArrow, IconCheck, IconClock, IconLayers, IconLock } from './icons'

/** Hero: G-style split layout in B's visual language (ported from variant-BG.html). */
export function Hero({ locale, dict }: { locale: Locale; dict: Messages }) {
  const h = dict.landing.hero
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-grid">
          {/* LEFT: content */}
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="dot" /> {h.eyebrow}
            </span>
            <h1>
              {h.titleLead}
              <span className="hl">{h.titleRed}</span>
              {h.titleMid}
              <span className="hl2">{h.titleBlue}</span>
              {h.titleEnd}
            </h1>
            <p className="sub">{h.subtitle}</p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" href={`/${locale}/auth/sign-up`}>
                {h.ctaPrimary} <IconArrow />
              </Link>
            </div>
            <div className="hero-undercta">
              <span className="check">
                <IconCheck />
              </span>
              {h.underCta}
            </div>
            <div className="hero-chips">
              <div className="info-chip">
                <div className="ic-dot">
                  <IconLayers />
                </div>
                <div className="ct">{h.chips.languages.title}</div>
                <div className="cl">{h.chips.languages.label}</div>
              </div>
              <div className="info-chip">
                <div className="ic-dot">
                  <IconClock />
                </div>
                <div className="ct">{h.chips.time.title}</div>
                <div className="cl">{h.chips.time.label}</div>
              </div>
              <div className="info-chip">
                <div className="ic-dot">
                  <IconLock />
                </div>
                <div className="ct">{h.chips.privacy.title}</div>
                <div className="cl">{h.chips.privacy.label}</div>
              </div>
            </div>
          </div>

          {/* RIGHT: pure-CSS red+blue duotone composition */}
          <HeroVisual dict={dict} />
        </div>
      </div>
    </section>
  )
}
