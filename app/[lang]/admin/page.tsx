import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { AppShell } from '@/components/layout/app-shell'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

// Demo mode renders an open preview with sample students (the whole demo is
// unauthenticated). Configured (Firebase) installs render the live dashboard,
// which fetches the roster with the admin's ID token; authorization is enforced
// server-side by the `admin: true` custom claim (see lib/admin/access.ts +
// /api/admin/students + docs/ADMIN_DASHBOARD.md). The page itself stays a thin
// shell — all access checks happen in the API layer.
export default function AdminPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <AppShell locale={locale} dict={dict}>
      <AdminDashboard locale={locale} dict={dict} />
    </AppShell>
  )
}
