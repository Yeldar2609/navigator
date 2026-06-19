import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import '../globals.css'
import { isLocale, locales, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'

export const metadata: Metadata = {
  title: 'Navigator — Find your direction',
  description: 'A self-determination companion for students in Kazakhstan.',
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default function LangLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { lang: string }
}) {
  if (!isLocale(params.lang)) notFound()
  const locale = params.lang as Locale
  const dict = getDictionary(locale)
  return (
    <html lang={locale}>
      <body>
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]"
        >
          {dict.common.skipToContent}
        </a>
        {children}
      </body>
    </html>
  )
}
