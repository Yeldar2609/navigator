import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { AppShell } from '@/components/layout/app-shell'
import { ResultsView } from '@/components/results/results-view'

export default function ResultsPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <AppShell locale={locale} dict={dict}>
      <ResultsView locale={locale} dict={dict} />
    </AppShell>
  )
}
