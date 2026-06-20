'use client'

import * as React from 'react'
import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/lib/auth/session'

export function ResetForm({ locale, dict }: { locale: Locale; dict: Messages }) {
  const t = dict.auth.reset

  const [email, setEmail] = React.useState('')
  const [sent, setSent] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Fire the request, but always show the same neutral confirmation regardless
    // of the outcome — this prevents account enumeration.
    await requestPasswordReset(email)
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t.sent}</p>
        <Link
          href={`/${locale}/auth/sign-in`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t.backToSignIn}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">{t.emailLabel}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.auth.fields.emailPlaceholder}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? dict.common.loading : t.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={`/${locale}/auth/sign-in`}
          className="font-medium text-primary hover:underline"
        >
          {t.backToSignIn}
        </Link>
      </p>
    </form>
  )
}
