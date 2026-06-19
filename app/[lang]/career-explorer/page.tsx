import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { AppShell } from '@/components/layout/app-shell'
import { CareerExplorer } from '@/components/careers/career-explorer'

export default function CareerExplorerPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <AppShell locale={locale} dict={dict}>
      <CareerExplorer locale={locale} dict={dict} />
    </AppShell>
  )
}
