import type { Messages } from '@/lib/i18n/dictionaries'
import { SectionHead } from './section-head'
import { IconClipboard, IconTarget, IconTrend, IconUser } from './icons'

/** Features grid (mockup `.features`): 4 cards with alternating gradient icon tiles. */
export function Features({ dict }: { dict: Messages }) {
  const f = dict.landing.features
  const cards = [
    { Icon: IconUser, ...f.understand },
    { Icon: IconTarget, ...f.directions },
    { Icon: IconClipboard, ...f.plan },
    { Icon: IconTrend, ...f.progress },
  ]
  return (
    <section className="features" id="features">
      <div className="wrap">
        <SectionHead tag={f.tag} title={f.title} subtitle={f.subtitle} />
        <div className="feat-grid">
          {cards.map(({ Icon, title, body }) => (
            <div className="feat" key={title}>
              <div className="ic">
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
