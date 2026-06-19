import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { AppShell } from '@/components/layout/app-shell'
import { CheckInView } from '@/components/check-ins/check-in-view'

export default function CheckInsPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <AppShell locale={locale} dict={dict}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{dict.checkIns.title}</h1>
        <p className="mt-1.5 text-muted-foreground">{dict.checkIns.subtitle}</p>
        <div className="mt-6">
          <CheckInView locale={locale} dict={dict} />
        </div>
      </div>
    </AppShell>
  )
}
