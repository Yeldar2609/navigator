import type { Messages } from '@/lib/i18n/dictionaries'
import { SectionHead } from './section-head'

/** Decorative mini-visuals per step (ported verbatim; aria-hidden, no text). */
function MiniBars() {
  return (
    <div className="mini-bars" aria-hidden="true">
      <span style={{ height: '40%' }} />
      <span className="b" style={{ height: '70%' }} />
      <span style={{ height: '55%' }} />
      <span className="r" style={{ height: '90%' }} />
      <span style={{ height: '60%' }} />
      <span className="b" style={{ height: '80%' }} />
      <span style={{ height: '45%' }} />
    </div>
  )
}

function MiniPlan({ labels }: { labels: [string, string, string] }) {
  return (
    <div className="mini-plan" aria-hidden="true">
      <div className="line">
        <span className="box on" /> {labels[0]}
      </div>
      <div className="line">
        <span className="box r" /> {labels[1]}
      </div>
      <div className="line">
        <span className="box off" /> {labels[2]}
      </div>
    </div>
  )
}

function MiniTrack({ progress, pace }: { progress: string; pace: string }) {
  return (
    <div className="mini-track" aria-hidden="true">
      <div className="mt-bar">
        <i className="a" />
      </div>
      <div className="mt-bar">
        <i className="b" />
      </div>
      <div className="mt-meta">
        <span>{progress}</span>
        <span>{pace}</span>
      </div>
    </div>
  )
}

export function HowItWorks({ dict }: { dict: Messages }) {
  const h = dict.landing.how
  const f = dict.landing.features
  return (
    <section id="how">
      <div className="wrap">
        <SectionHead tag={h.tag} title={h.title} subtitle={h.subtitle} />
        <div className="how-grid">
          <div className="how-card">
            <div className="step-no">
              <span className="ring">1</span> {h.step1.label}
            </div>
            <h3>{h.step1.title}</h3>
            <p>{h.step1.body}</p>
            <div className="visual-mini">
              <MiniBars />
            </div>
          </div>
          <div className="how-card">
            <div className="step-no">
              <span className="ring">2</span> {h.step2.label}
            </div>
            <h3>{h.step2.title}</h3>
            <p>{h.step2.body}</p>
            <div className="visual-mini">
              <MiniPlan
                labels={[f.understand.title, f.directions.title, h.step1.title]}
              />
            </div>
          </div>
          <div className="how-card">
            <div className="step-no">
              <span className="ring">3</span> {h.step3.label}
            </div>
            <h3>{h.step3.title}</h3>
            <p>{h.step3.body}</p>
            <div className="visual-mini">
              <MiniTrack progress={h.tag} pace={h.step3.label} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
