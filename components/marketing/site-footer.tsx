import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'

/** Dark footer (mockup `footer.site`): brand + link columns + bottom langtag. */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Messages }) {
  const f = dict.landing.footer
  const columns = [
    {
      title: f.productTitle,
      links: [
        { label: f.linkFeatures, href: '#features' },
        { label: f.linkHow, href: '#how' },
        { label: f.linkStart, href: `/${locale}/auth/sign-up` },
      ],
    },
    {
      title: f.supportTitle,
      links: [
        { label: f.linkFaq, href: '#' },
        { label: f.linkParents, href: '#' },
        { label: f.linkContact, href: '#' },
      ],
    },
    {
      title: f.legalTitle,
      links: [
        { label: f.linkPrivacy, href: '#privacy' },
        { label: f.linkTerms, href: '#' },
      ],
    },
  ]
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="wordmark">
              <span className="mark">KB</span>
              <span>Kim Bolam</span>
            </div>
            <p>{f.description}</p>
          </div>
          <div className="foot-cols">
            {columns.map((col) => (
              <div className="foot-col" key={col.title}>
                <h4>{col.title}</h4>
                {col.links.map((link) => (
                  <Link key={link.label} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="foot-bottom">
          <span>{f.rights}</span>
          <span className="langtag">
            <span>RU</span>
            <span>KK</span>
            <span>EN</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
