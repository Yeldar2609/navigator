import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardView } from '@/components/dashboard/dashboard-view'

export default function DashboardPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <AppShell locale={locale} dict={dict}>
      <DashboardView locale={locale} dict={dict} />
    </AppShell>
  )
}
