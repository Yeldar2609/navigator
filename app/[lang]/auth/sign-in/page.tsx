import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthForm } from '@/components/auth/auth-form'

export default function SignInPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <>
      <TopBar locale={locale} />
      <Container className="flex min-h-[calc(100dvh-4rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">{dict.auth.signIn.title}</CardTitle>
            <CardDescription>{dict.auth.signIn.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="sign-in" locale={locale} dict={dict} />
          </CardContent>
        </Card>
      </Container>
    </>
  )
}
