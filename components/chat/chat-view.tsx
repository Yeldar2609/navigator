'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bot, ChevronDown, Send } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import type { ChatActionKind } from '@/lib/ai/counselor'
import { PRIVACY_INPUT_HINT } from '@/lib/ai/counselor-guardrails'
import { actionHref } from '@/lib/ai/tools'
import { getChatThread, sendChatMessage } from '@/lib/data/chat'
import { getLatestResult } from '@/lib/data/assessment'
import { getPlan } from '@/lib/data/plan'
import type { StoredChatMessage } from '@/lib/data/types'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { interpolate } from '@/lib/utils/format'

function Avatar() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
      <Bot className="h-5 w-5" />
    </span>
  )
}

function AssistantBubble({
  msg,
  locale,
  dict,
}: {
  msg: StoredChatMessage
  locale: Locale
  dict: Messages
}) {
  const t = dict.d4.chat
  const [showWhy, setShowWhy] = React.useState(false)
  return (
    <div className="flex gap-3">
      <Avatar />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm">{msg.content}</div>
        {msg.safetyNotice ? (
          <p className="mt-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-foreground/90">
            {msg.safetyNotice}
          </p>
        ) : null}
        {msg.suggestedActions && msg.suggestedActions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.suggestedActions.map((a) => (
              <Link
                key={a.kind}
                href={actionHref(a.kind as ChatActionKind, locale)}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                {a.label}
              </Link>
            ))}
          </div>
        ) : null}
        {msg.referencedFactors && msg.referencedFactors.length > 0 ? (
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showWhy && 'rotate-180')} />
              {t.whyThis}
            </button>
            {showWhy ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {interpolate(t.whyThisBody, { factors: msg.referencedFactors.join(' · ') })}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ChatView({
  locale,
  dict,
  aiEnabled,
}: {
  locale: Locale
  dict: Messages
  aiEnabled: boolean
}) {
  const t = dict.d4.chat
  const p = dict.d4.prompts
  const reduce = useReducedMotion()
  const [messages, setMessages] = React.useState<StoredChatMessage[]>([])
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [hasResult, setHasResult] = React.useState(false)
  const [hasPlan, setHasPlan] = React.useState(false)
  const endRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMessages(getChatThread()?.messages ?? [])
    setHasResult(!!getLatestResult())
    setHasPlan(!!getPlan())
  }, [])

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }, [messages, sending, reduce])

  const chips = !hasResult
    ? [p.beforeWhatHelp, p.beforeStart, p.beforeUnsure]
    : hasPlan
      ? [p.planWeek, p.planEasier, p.afterParents, p.afterSkills]
      : [p.afterExplain, p.afterCareers, p.afterPlan3, p.afterSubjects, p.afterParents]

  async function send(text: string) {
    const message = text.trim()
    if (!message || sending) return
    setInput('')
    setSending(true)
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${prev.length}`, role: 'user', content: message, createdAt: '' },
    ])
    try {
      const { thread } = await sendChatMessage({ message, locale, dict })
      setMessages(thread.messages)
      setHasPlan(!!getPlan())
    } finally {
      setSending(false)
    }
  }

  // Disabled-safe state: when the AI counselor is not configured we must NOT
  // present a fake AI chat. Show an honest "coming soon" panel — no Bot avatar,
  // no "AI guide" framing, no composer, no template replies — with a single CTA
  // back to results. (Hooks above always run, preserving Rules of Hooks.)
  if (!aiEnabled) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col">
        <div>
          <h1 className="text-2xl font-bold">{dict.chat.title}</h1>
          <p className="mt-1.5 text-muted-foreground">{dict.chat.subtitle}</p>
        </div>
        <div className="mt-6 rounded-2xl border bg-card p-6 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">{dict.chat.shellNote}</p>
          <Link
            href={`/${locale}/results`}
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-4')}
          >
            {t.actionResults}
          </Link>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">{dict.chat.disclaimer}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div>
        <h1 className="text-2xl font-bold">{dict.chat.title}</h1>
        <p className="mt-1.5 text-muted-foreground">{dict.chat.subtitle}</p>
      </div>

      <div className="mt-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex gap-3">
            <Avatar />
            <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm">{t.empty}</div>
          </div>
        ) : (
          messages.map((m) =>
            m.role === 'assistant' ? (
              <AssistantBubble key={m.id} msg={m} locale={locale} dict={dict} />
            ) : (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                  {m.content}
                </div>
              </div>
            ),
          )
        )}

        <AnimatePresence>
          {sending ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <Avatar />
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-muted-foreground">
                {t.thinking}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Contextual prompt chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="w-full text-xs font-medium text-muted-foreground">{t.suggestedTitle}</span>
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => send(chip)}
            disabled={sending}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Composer */}
      {/* Static on mobile (clears the fixed bottom-nav); sticky only on desktop. */}
      <div className="mt-4 rounded-2xl border bg-card p-2 shadow-soft md:sticky md:bottom-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder={t.inputPlaceholder}
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            aria-label={t.inputPlaceholder}
          />
          <Button size="sm" onClick={() => send(input)} disabled={sending || !input.trim()}>
            <Send className="h-4 w-4" />
            {t.send}
          </Button>
        </div>
        {/* Subtle privacy hint near the input (Day 6 requirement). */}
        <p className="mt-1 px-2 text-xs text-muted-foreground/80">{PRIVACY_INPUT_HINT[locale]}</p>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">{t.disclaimer}</p>
    </div>
  )
}
