'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import {
  BLOCKS,
  ITEM_CODES,
  itemsByBlock,
  promptFor,
  type Block,
} from '@/lib/methodology/assessment-items'
import { getSavedAnswers, saveAnswer, submitAssessment, TOTAL_QUESTIONS } from '@/lib/data/assessment'
import { demoStore } from '@/lib/demo/store'
import { isDemoMode } from '@/lib/data/mode'
import { Button } from '@/components/ui/button'
import { PulseSavedIndicator } from '@/components/motion/pulse-saved-indicator'
import { cn } from '@/lib/utils/cn'
import { interpolate } from '@/lib/utils/format'

type Phase = 'section-intro' | 'question' | 'section-done' | 'review' | 'building'

const SECTIONS = BLOCKS.map((block) => ({ block, items: itemsByBlock(block) }))

/** Locate a question code's section + within-section index. */
function locate(code: string): { si: number; qi: number } {
  for (let s = 0; s < SECTIONS.length; s++) {
    const qi = SECTIONS[s].items.findIndex((it) => it.code === code)
    if (qi !== -1) return { si: s, qi }
  }
  return { si: 0, qi: 0 }
}

export function AssessmentFlow({ locale, dict }: { locale: Locale; dict: Messages }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const t = dict.d2.assessment

  const [sectionIdx, setSectionIdx] = React.useState(0)
  const [qIdx, setQIdx] = React.useState(0)
  const [phase, setPhase] = React.useState<Phase>('section-intro')
  const [answers, setAnswers] = React.useState<Record<string, number>>({})
  const [saved, setSaved] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [resumed, setResumed] = React.useState(false)
  const advancing = React.useRef(false)
  const finishTimer = React.useRef<number | null>(null)

  // Resume: drop the student back at the first unanswered question (or the review
  // screen if everything is answered) instead of restarting from section 1.
  React.useEffect(() => {
    const savedAnswers = getSavedAnswers()
    setAnswers(savedAnswers)
    if (Object.keys(savedAnswers).length === 0) return
    const firstUnanswered = ITEM_CODES.find((c) => savedAnswers[c] == null)
    if (!firstUnanswered) {
      setPhase('review')
    } else {
      const { si, qi } = locate(firstUnanswered)
      setSectionIdx(si)
      setQIdx(qi)
      setPhase('question')
    }
    setResumed(true)
  }, [])

  // Cancel a pending submit+navigate if the user leaves mid-build.
  React.useEffect(
    () => () => {
      if (finishTimer.current) window.clearTimeout(finishTimer.current)
    },
    [],
  )

  // DEV/demo-only test hook used by the e2e to fill the assessment quickly.
  React.useEffect(() => {
    if (!isDemoMode()) return
    const w = window as unknown as {
      __navTestFill?: (v?: number) => Promise<void>
      __navTestSeed?: (v?: number, count?: number) => void
    }
    w.__navTestFill = async (value = 4) => {
      for (const code of ITEM_CODES) demoStore.saveAnswer(code, value)
      await submitAssessment()
    }
    // Seed answers WITHOUT submitting — lets the e2e land on resume / review.
    w.__navTestSeed = (value = 4, count = ITEM_CODES.length) => {
      for (const code of ITEM_CODES.slice(0, count)) demoStore.saveAnswer(code, value)
    }
    return () => {
      delete w.__navTestFill
      delete w.__navTestSeed
    }
  }, [])

  const section = SECTIONS[sectionIdx]
  const item = section.items[qIdx]
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount >= TOTAL_QUESTIONS
  const blockLabel = dict.assessment.blocks[section.block]
  const introByBlock: Record<Block, string> = {
    interests: t.introInterests,
    competencies: t.introCompetencies,
    values: t.introValues,
    strengths: t.introStrengths,
  }
  const encByBlock: Record<Block, string> = {
    interests: t.encInterests,
    competencies: t.encCompetencies,
    values: t.encValues,
    strengths: t.encValues,
  }
  const scaleLabels = [t.scale1, t.scale2, t.scale3, t.scale4, t.scale5]

  function pick(value: number) {
    // Guard against double-tap within the transition window: a second tap would
    // queue a second advance and skip a question (or overshoot the last item).
    if (advancing.current) return
    advancing.current = true
    if (resumed) setResumed(false)
    const code = item.code
    setAnswers((prev) => ({ ...prev, [code]: value }))
    void saveAnswer(code, value)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1300)
    window.setTimeout(() => {
      advancing.current = false
      if (editing) {
        // Editing one answer from the review screen — go straight back.
        setEditing(false)
        setPhase('review')
      } else if (qIdx < section.items.length - 1) {
        setQIdx((i) => i + 1)
      } else {
        setPhase('section-done')
      }
    }, 420)
  }

  function continueFromDone() {
    if (sectionIdx < SECTIONS.length - 1) {
      setSectionIdx((s) => s + 1)
      setQIdx(0)
      setPhase('section-intro')
    } else {
      setPhase('review')
    }
  }

  function editQuestion(code: string) {
    const { si, qi } = locate(code)
    setSectionIdx(si)
    setQIdx(qi)
    setEditing(true)
    setPhase('question')
  }

  function jumpToSection(i: number) {
    setEditing(false)
    setResumed(false)
    setSectionIdx(i)
    const firstUn = SECTIONS[i].items.findIndex((it) => answers[it.code] == null)
    setQIdx(firstUn === -1 ? 0 : firstUn)
    setPhase('question')
  }

  function finish() {
    setPhase('building')
    finishTimer.current = window.setTimeout(async () => {
      await submitAssessment()
      // replace (not push) so the browser Back button doesn't return to the
      // already-submitted assessment.
      router.replace(`/${locale}/results`)
    }, 1000)
  }

  function goBack() {
    if (editing) {
      setEditing(false)
      setPhase('review')
    } else if (phase === 'question' && qIdx > 0) {
      setQIdx((i) => i - 1)
    } else if (phase === 'question' && qIdx === 0) {
      setPhase('section-intro')
    } else if (phase === 'section-intro' && sectionIdx > 0) {
      setSectionIdx((s) => s - 1)
      setQIdx(SECTIONS[sectionIdx - 1].items.length - 1)
      setPhase('question')
    } else if (phase === 'section-done') {
      setQIdx(section.items.length - 1)
      setPhase('question')
    }
  }

  const backDisabled = phase === 'section-intro' && sectionIdx === 0 && !editing

  if (phase === 'building') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-5 text-lg font-medium">{t.buildingProfile}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {phase === 'review'
            ? `${answeredCount}/${TOTAL_QUESTIONS}`
            : interpolate(t.sectionLabel, {
                section: blockLabel,
                current: answeredCount,
                total: TOTAL_QUESTIONS,
              })}
        </span>
        <PulseSavedIndicator show={saved} label={dict.assessment.saved} />
      </div>

      {/* Section map — per-section progress; tap to jump between sections. */}
      <div className="flex gap-1.5">
        {SECTIONS.map((s, i) => {
          const ans = s.items.filter((it) => answers[it.code] != null).length
          const pct = (ans / s.items.length) * 100
          const current =
            i === sectionIdx && (phase === 'question' || phase === 'section-intro' || phase === 'section-done')
          return (
            <button
              key={s.block}
              type="button"
              onClick={() => jumpToSection(i)}
              className="group flex-1 text-left"
              aria-label={dict.assessment.blocks[s.block]}
              aria-current={current ? 'step' : undefined}
            >
              <div
                className={cn(
                  'h-1.5 w-full overflow-hidden rounded-full bg-muted',
                  current && 'ring-1 ring-primary ring-offset-1 ring-offset-background',
                )}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="mt-1 block truncate text-[10px] text-muted-foreground group-hover:text-foreground">
                {dict.assessment.blocks[s.block]}
              </span>
            </button>
          )
        })}
      </div>

      {resumed && phase === 'question' ? (
        <p className="mt-3 rounded-lg bg-primary-soft px-3 py-2 text-xs font-medium text-primary">
          {t.resumeNote}
        </p>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${phase}-${sectionIdx}-${qIdx}`}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="mt-6"
        >
          {phase === 'section-intro' && (
            <div className="rounded-2xl border bg-gradient-to-br from-primary-soft to-card p-8 text-center shadow-soft">
              <span className="inline-flex rounded-full bg-card px-3 py-1 text-xs font-medium text-primary">
                {blockLabel}
              </span>
              <p className="mx-auto mt-4 max-w-md text-xl font-semibold">
                {introByBlock[section.block]}
              </p>
              <Button className="mt-6" onClick={() => setPhase('question')}>
                {t.sectionBegin}
              </Button>
            </div>
          )}

          {phase === 'question' && (
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                {blockLabel}
              </span>
              <p className="mt-4 text-lg font-medium">{promptFor(item.code, locale)}</p>
              <div className="mt-6 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => pick(v)}
                    aria-pressed={answers[item.code] === v}
                    aria-label={`${v} — ${scaleLabels[v - 1]}`}
                    className={cn(
                      'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-3 text-center transition-all active:scale-95',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      answers[item.code] === v
                        ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted',
                    )}
                  >
                    <span className="text-base font-semibold">{v}</span>
                    <span className="hidden text-[11px] leading-tight opacity-80 sm:block">
                      {scaleLabels[v - 1]}
                    </span>
                  </button>
                ))}
              </div>
              {/* On phones the per-button labels are hidden; show the endpoints for context. */}
              <div className="mt-2 flex justify-between text-xs text-muted-foreground sm:hidden">
                <span>{scaleLabels[0]}</span>
                <span>{scaleLabels[4]}</span>
              </div>
              {answers[item.code] == null && (
                <p className="mt-3 text-center text-xs text-muted-foreground">{t.answerToContinue}</p>
              )}
            </div>
          )}

          {phase === 'section-done' && (
            <div className="rounded-2xl border bg-gradient-to-br from-primary-soft to-card p-8 text-center shadow-soft">
              <p className="mx-auto max-w-md text-xl font-semibold">{encByBlock[section.block]}</p>
              <Button className="mt-6" onClick={continueFromDone}>
                {sectionIdx < SECTIONS.length - 1 ? dict.d2.common.continueBtn : dict.assessment.finish}
              </Button>
            </div>
          )}

          {phase === 'review' && (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-gradient-to-br from-primary-soft to-card p-6 text-center shadow-soft">
                <p className="text-xl font-semibold">{t.reviewTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.reviewSubtitle}</p>
              </div>
              {SECTIONS.map((s) => (
                <div key={s.block} className="rounded-2xl border bg-card p-5 shadow-soft">
                  <h3 className="text-sm font-semibold text-primary">
                    {dict.assessment.blocks[s.block]}
                  </h3>
                  <ul className="mt-2 divide-y divide-border">
                    {s.items.map((it) => {
                      const v = answers[it.code]
                      return (
                        <li key={it.code} className="flex items-start justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm">{promptFor(it.code, locale)}</p>
                            <p
                              className={cn(
                                'mt-0.5 text-xs font-medium',
                                v != null ? 'text-muted-foreground' : 'text-accent',
                              )}
                            >
                              {v != null ? scaleLabels[v - 1] : t.answerToContinue}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => editQuestion(it.code)}
                            className="shrink-0 text-xs font-medium text-primary hover:underline"
                          >
                            {t.change}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
              <div>
                <Button size="lg" className="w-full" onClick={finish} disabled={!allAnswered}>
                  {t.submitAll}
                </Button>
                {!allAnswered ? (
                  <p className="mt-2 text-center text-xs text-muted-foreground">{t.answerToContinue}</p>
                ) : null}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {phase !== 'review' ? (
        <div className="mt-5">
          <Button variant="ghost" size="sm" onClick={goBack} disabled={backDisabled}>
            {editing ? t.backToReview : dict.d2.common.backBtn}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
