import type { Messages } from '@/lib/i18n/dictionaries'
import { SectionHead } from './section-head'

/** Language cards (mockup `.lang-sec`): RU / KK / EN with gradient code tiles. */
export function Languages({ dict }: { dict: Messages }) {
  const l = dict.landing.languages
  const cards = [
    { code: 'RU', ...l.ru },
    { code: 'KK', ...l.kk },
    { code: 'EN', ...l.en },
  ]
  return (
    <section className="lang-sec">
      <div className="wrap">
        <SectionHead tag={l.tag} title={l.title} subtitle={l.subtitle} />
        <div className="lang-cards">
          {cards.map(({ code, title, body }) => (
            <div className="lang-card" key={code}>
              <div className="code">{code}</div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
