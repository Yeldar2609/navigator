import type { Messages } from '@/lib/i18n/dictionaries'
import { IconCheck, IconLock } from './icons'

/** Dark-blue privacy band with the red radial glow (mockup `.privacy`). */
export function Privacy({ dict }: { dict: Messages }) {
  const p = dict.landing.privacy
  const items = [p.item1, p.item2, p.item3]
  return (
    <section className="privacy" id="privacy">
      <div className="wrap">
        <div className="privacy-card">
          <div className="p-left">
            <div className="lock">
              <IconLock width={26} height={26} stroke="#fff" strokeWidth={2} />
            </div>
            <h2>{p.title}</h2>
            <p>{p.body}</p>
          </div>
          <div className="privacy-list">
            {items.map((item) => (
              <div className="item" key={item.title}>
                <span className="tick">
                  <IconCheck />
                </span>
                <span>
                  <span className="t">{item.title}</span>
                  <span className="d">{item.body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
