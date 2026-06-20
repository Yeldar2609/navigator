import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { IconArrow } from './icons'

/** Soft final CTA card (mockup `.final`) with the single red primary CTA. */
export function FinalCta({ locale, dict }: { locale: Locale; dict: Messages }) {
  const c = dict.landing.finalCta
  return (
    <section className="final">
      <div className="wrap">
        <div className="final-card">
          <h2>{c.title}</h2>
          <p>{c.body}</p>
          <Link className="btn btn-primary btn-lg" href={`/${locale}/auth/sign-up`}>
            {c.cta} <IconArrow />
          </Link>
          <div className="final-note">{c.note}</div>
        </div>
      </div>
    </section>
  )
}
