import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { AppShell } from '@/components/layout/app-shell'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

// Demo mode renders an open preview with sample students (the whole demo is
// unauthenticated). Configured installs enforce role-based access (see
// /api/admin/students + docs/ADMIN_DASHBOARD.md).
export default function AdminPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <AppShell locale={locale} dict={dict}>
      <AdminDashboard locale={locale} dict={dict} />
    </AppShell>
  )
}
