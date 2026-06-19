'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { localeLabels, locales, type Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { GOAL_KEYS, GRADE_CHOICES, SUBJECT_KEYS, SUPPORT_KEYS } from '@/lib/onboarding/options'
import { GOAL_LABELS, SUBJECT_LABELS, SUPPORT_LABELS, labelFor } from '@/lib/methodology/tag-labels'
import type { SupportPreference } from '@/lib/methodology/scoring-config'
import { saveProfile } from '@/lib/data/profile'
import type { StoredProfile } from '@/lib/data/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { AnimatedProgressBar } from '@/components/motion/animated-progress-bar'
import { CelebrateCheckmark } from '@/components/motion/celebrate-checkmark'
import { cn } from '@/lib/utils/cn'
import { interpolate } from '@/lib/utils/format'

const OTHER_LABEL: Record<Locale, string> = { en: 'Other', ru: 'Другое', kk: 'Басқа' }
const TOTAL_STEPS = 4

function toggle(list: string[], key: string): string[] {
  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key]
}

export function OnboardingWizard({ locale, dict }: { locale: Locale; dict: Messages }) {
  const reduce = useReducedMotion()
  const t = dict.d2.onboarding

  const [step, setStep] = React.useState(0)
  const [done, setDone] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState(false)

  const [displayName, setDisplayName] = React.useState('')
  const [gradeChoice, setGradeChoice] = React.useState<string>('')
  const [preferredLanguage, setPreferredLanguage] = React.useState<string>(locale)
  const [schoolCode, setSchoolCode] = React.useState('')
  const [favoriteSubjects, setFavoriteSubjects] = React.useState<string[]>([])
  const [currentGoals, setCurrentGoals] = React.useState<string[]>([])
  const [careerConfidence, setCareerConfidence] = React.useState(3)
  const [supportPreference, setSupportPreference] = React.useState<SupportPreference>('simple_guidance')
  const [freeTextGoal, setFreeTextGoal] = React.useState('')

  const canAdvance = step !== 0 || (displayName.trim().length > 0 && gradeChoice !== '')
  const stepTitles = [t.stepBasics, t.stepSubjects, t.stepGoals, t.stepConfidence]

  async function finish() {
    setSaving(true)
    setSaveError(false)
    const profile: StoredProfile = {
      displayName: displayName.trim(),
      gradeChoice,
      gradeLevel: gradeChoice === 'other' ? null : Number(gradeChoice),
      preferredLanguage: preferredLanguage as Locale,
      schoolCode: schoolCode.trim() || undefined,
      favoriteSubjects,
      currentGoals,
      careerConfidence,
      supportPreference,
      freeTextGoal: freeTextGoal.trim() || undefined,
      onboardingCompleted: true,
    }
    const ok = await saveProfile(profile)
    setSaving(false)
    if (!ok) {
      setSaveError(true)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft"
      >
        <div className="flex justify-center">
          <CelebrateCheckmark />
        </div>
        <h2 className="mt-6 text-2xl font-bold">{t.celebrationTitle}</h2>
        <p className="mt-2 text-muted-foreground">{t.celebrationBody}</p>
        <Link
          href={`/${locale}/assessment`}
          className={cn(buttonVariants({ size: 'lg' }), 'mt-6 w-full')}
        >
          {t.celebrationCta}
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{stepTitles[step]}</span>
          <span className="text-muted-foreground">
            {interpolate(dict.d2.common.stepOf, { current: step + 1, total: TOTAL_STEPS })}
          </span>
        </div>
        <AnimatedProgressBar value={((step + 1) / TOTAL_STEPS) * 100} />
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{dict.onboarding.fields.displayName}</Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={dict.onboarding.fields.displayNamePlaceholder}
                  />
                </div>
                <div>
                  <Label>{dict.onboarding.fields.grade}</Label>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_CHOICES.map((g) => (
                      <Chip key={g} selected={gradeChoice === g} onClick={() => setGradeChoice(g)}>
                        {g === 'other' ? OTHER_LABEL[locale] : g}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="lang">{dict.onboarding.fields.language}</Label>
                  <Select
                    id="lang"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                  >
                    {locales.map((l) => (
                      <option key={l} value={l}>
                        {localeLabels[l]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="school">
                    {dict.onboarding.fields.schoolCode}{' '}
                    <span className="font-normal text-muted-foreground">
                      ({dict.common.optional})
                    </span>
                  </Label>
                  <Input
                    id="school"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    placeholder={dict.onboarding.fields.schoolCodePlaceholder}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h3 className="text-lg font-semibold">{t.subjectsTitle}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.subjectsHint}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUBJECT_KEYS.map((key) => (
                    <Chip
                      key={key}
                      selected={favoriteSubjects.includes(key)}
                      onClick={() => setFavoriteSubjects((s) => toggle(s, key))}
                    >
                      {labelFor(SUBJECT_LABELS, key, locale)}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-lg font-semibold">{t.goalsTitle}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.goalsHint}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {GOAL_KEYS.map((key) => (
                    <Chip
                      key={key}
                      selected={currentGoals.includes(key)}
                      onClick={() => setCurrentGoals((s) => toggle(s, key))}
                    >
                      {labelFor(GOAL_LABELS, key, locale)}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="confidence">{t.confidenceTitle}</Label>
                  <Slider
                    id="confidence"
                    ariaLabel={t.confidenceTitle}
                    value={careerConfidence}
                    onChange={setCareerConfidence}
                    lowLabel={t.confidenceLow}
                    highLabel={t.confidenceHigh}
                  />
                </div>
                <div>
                  <Label>{t.supportTitle}</Label>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORT_KEYS.map((key) => (
                      <Chip
                        key={key}
                        selected={supportPreference === key}
                        onClick={() => setSupportPreference(key)}
                      >
                        {labelFor(SUPPORT_LABELS, key, locale)}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="future">{t.freeTextTitle}</Label>
                  <Textarea
                    id="future"
                    value={freeTextGoal}
                    onChange={(e) => setFreeTextGoal(e.target.value)}
                    placeholder={t.freeTextPlaceholder}
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{t.freeTextOptional}</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            {dict.d2.common.backBtn}
          </Button>
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              {dict.d2.common.continueBtn}
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving}>
              {saving ? dict.common.saving : dict.d2.common.finishBtn}
            </Button>
          )}
        </div>
        {saveError ? (
          <p className="mt-3 text-center text-sm text-destructive">{dict.common.error}</p>
        ) : null}
      </div>
    </div>
  )
}
