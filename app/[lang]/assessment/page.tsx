import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { AppShell } from '@/components/layout/app-shell'
import { AssessmentFlow } from '@/components/assessment/assessment-flow'

export default function AssessmentPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <AppShell locale={locale} dict={dict}>
      <div className="mb-2 text-center">
        <h1 className="text-2xl font-bold">{dict.assessment.title}</h1>
        <p className="mt-1.5 text-muted-foreground">{dict.assessment.subtitle}</p>
      </div>
      <div className="mt-6">
        <AssessmentFlow locale={locale} dict={dict} />
      </div>
    </AppShell>
  )
}
