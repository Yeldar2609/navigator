import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { AppShell } from '@/components/layout/app-shell'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default function OnboardingPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <AppShell locale={locale} dict={dict}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">{dict.onboarding.title}</h1>
        <p className="mt-1.5 text-muted-foreground">{dict.onboarding.subtitle}</p>
      </div>
      <OnboardingWizard locale={locale} dict={dict} />
    </AppShell>
  )
}
