'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isDemoMode } from '@/lib/data/mode'
import { signInOrUp, signInWithGoogle } from '@/lib/auth/session'
import { resolvePostAuthPath } from '@/lib/auth/post-signin'
import { signInSchema, signUpSchema } from '@/lib/validations/auth'

export function AuthForm({
  mode,
  locale,
  dict,
}: {
  mode: 'sign-in' | 'sign-up'
  locale: Locale
  dict: Messages
}) {
  const router = useRouter()
  const demo = isDemoMode()
  const t = mode === 'sign-in' ? dict.auth.signIn : dict.auth.signUp

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'sign-up') {
      const parsed = signUpSchema.safeParse({ email, password, confirmPassword: confirm })
      if (!parsed.success) {
        const mismatch = parsed.error.issues.some((i) => i.path.includes('confirmPassword'))
        setError(mismatch ? dict.auth.errors.mismatch : dict.auth.errors.invalid)
        return
      }
    } else {
      const parsed = signInSchema.safeParse({ email, password })
      if (!parsed.success) {
        setError(dict.auth.errors.invalid)
        return
      }
    }

    setLoading(true)
    const res = await signInOrUp(mode, email, password)
    if (!res.ok) {
      setError(res.error === 'not_configured' ? dict.auth.notice.setupBody : dict.auth.errors.generic)
      setLoading(false)
      return
    }
    // Route by the user's actual state (await so it doesn't race the redirect):
    // returning users with results go to the dashboard, not back to the test.
    router.push(await resolvePostAuthPath(locale))
  }

  async function onGoogle() {
    setError(null)
    setLoading(true)
    const res = await signInWithGoogle()
    if (!res.ok) {
      if (res.error !== 'cancelled') setError(dict.auth.errors.generic)
      setLoading(false)
      return
    }
    router.push(await resolvePostAuthPath(locale))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {demo ? (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{dict.common.notConnected}</Badge>
          <span className="text-xs text-muted-foreground">{dict.auth.signIn.subtitle}</span>
        </div>
      ) : null}

      <div>
        <Label htmlFor="email">{dict.auth.fields.email}</Label>
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

      <div>
        <Label htmlFor="password">{dict.auth.fields.password}</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={dict.auth.fields.passwordPlaceholder}
          required
        />
      </div>

      {mode === 'sign-up' ? (
        <div>
          <Label htmlFor="confirm">{dict.auth.fields.confirmPassword}</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
      ) : (
        <div className="text-right">
          <Link
            href={`/${locale}/auth/reset`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {dict.auth.signIn.forgotPassword}
          </Link>
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? dict.common.loading : t.submit}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={onGoogle}
      >
        {dict.auth.signIn.continueWithGoogle}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.switchPrompt}{' '}
        <Link
          href={`/${locale}/auth/${mode === 'sign-in' ? 'sign-up' : 'sign-in'}`}
          className="font-medium text-primary hover:underline"
        >
          {t.switchCta}
        </Link>
      </p>
    </form>
  )
}
