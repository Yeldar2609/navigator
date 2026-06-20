import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'

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
    <footer className="bg-[#0F1623] py-14 text-white/70">
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-10 border-b border-white/10 pb-9">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-accent-strong text-sm font-extrabold text-white">
                KB
              </span>
              Kim Bolam
            </div>
            <p className="mt-3.5 text-sm font-medium text-white/60">{f.description}</p>
          </div>
          <div className="flex flex-wrap gap-12 sm:gap-16">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-xs font-extrabold uppercase tracking-[0.07em] text-white">
                  {col.title}
                </h4>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="mb-2.5 block text-sm font-medium text-white/65 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-xs font-medium text-white/50">
          <span>{f.rights}</span>
          <span className="inline-flex gap-2">
            {['RU', 'KK', 'EN'].map((code) => (
              <span
                key={code}
                className="rounded-md border border-white/15 px-2 py-0.5 text-xs font-bold"
              >
                {code}
              </span>
            ))}
          </span>
        </div>
      </Container>
    </footer>
  )
}
