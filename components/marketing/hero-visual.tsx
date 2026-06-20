import type { Messages } from '@/lib/i18n/dictionaries'

/**
 * Hero right column — mockup B's "your plan" dashboard card (ported from
 * variant-B.html): direction + strengths, a plan-progress bar, subject chips,
 * three mini step-rows, and two floating stat cards. Decorative (aria-hidden);
 * all text comes from i18n so it stays trilingual.
 */
export function HeroVisual({ dict }: { dict: Messages }) {
  const pc = dict.landing.hero.planCard
  return (
    <div className="visual" aria-hidden="true">
      <div className="plan-card">
        <div className="plan-top">
          <span className="label">{pc.label}</span>
          <span className="tag">{pc.updated}</span>
        </div>
        <div className="plan-title">
          {pc.directionLabel} <span className="role">{pc.direction}</span>
        </div>
        <p className="plan-desc">{pc.strengths}</p>

        <div className="progress">
          <div className="progress-head">
            <span>{pc.progressLabel}</span>
            <span className="pct">{pc.progressPct}</span>
          </div>
          <div className="bar">
            <i />
          </div>
        </div>

        <div className="chips">
          <span className="chip on">{pc.chips[0]}</span>
          <span className="chip blue">{pc.chips[1]}</span>
          <span className="chip">{pc.chips[2]}</span>
          <span className="chip blue">{pc.chips[3]}</span>
        </div>

        <div className="steps-mini">
          <div className="step-row done">
            <span className="num">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="txt">{pc.steps[0].title}</span>
            <span className="st">{pc.steps[0].status}</span>
          </div>
          <div className="step-row now">
            <span className="num">2</span>
            <span className="txt">{pc.steps[1].title}</span>
            <span className="st">{pc.steps[1].status}</span>
          </div>
          <div className="step-row todo">
            <span className="num">3</span>
            <span className="txt">{pc.steps[2].title}</span>
            <span className="st">{pc.steps[2].status}</span>
          </div>
        </div>
      </div>

      <div className="float-card float-1">
        <span className="ic">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
        </span>
        <span>
          <span className="k">{pc.matchLabel}</span>
          <br />
          <span className="v">{pc.matchValue}</span>
        </span>
      </div>
      <div className="float-card float-2">
        <span className="ic">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </span>
        <span>
          <span className="k">{pc.stepsDoneLabel}</span>
          <br />
          <span className="v">{pc.stepsDoneValue}</span>
        </span>
      </div>
    </div>
  )
}
