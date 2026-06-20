import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { MotionCard } from '@/components/motion/motion-card'
import { SectionHead } from './section-head'

/** Decorative mini-visuals per step (aria-hidden, no text to translate). */
function StepBars() {
  const bars = [
    { h: '40%', tone: 'bg-accent-soft' },
    { h: '70%', tone: 'bg-accent' },
    { h: '55%', tone: 'bg-accent-soft' },
    { h: '90%', tone: 'bg-primary' },
    { h: '60%', tone: 'bg-accent-soft' },
    { h: '80%', tone: 'bg-accent' },
    { h: '45%', tone: 'bg-accent-soft' },
  ]
  return (
    <div aria-hidden className="flex h-14 items-end gap-1.5">
      {bars.map((b, i) => (
        <span key={i} className={`flex-1 rounded-t-md ${b.tone}`} style={{ height: b.h }} />
      ))}
    </div>
  )
}

function StepChecklist() {
  const lines = ['bg-accent', 'bg-primary', 'border-2 border-border bg-transparent']
  return (
    <div aria-hidden className="grid gap-2.5">
      {lines.map((tone, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className={`h-4 w-4 flex-none rounded ${tone}`} />
          <span className="h-2 flex-1 rounded-full bg-secondary" />
        </div>
      ))}
    </div>
  )
}

function StepTrack() {
  return (
    <div aria-hidden className="grid gap-3">
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <span className="block h-full w-4/5 rounded-full bg-accent" />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <span className="block h-full w-[45%] rounded-full bg-primary" />
      </div>
    </div>
  )
}

export function HowItWorks({ dict }: { dict: Messages }) {
  const h = dict.landing.how
  const steps = [
    { ...h.step1, Mini: StepBars },
    { ...h.step2, Mini: StepChecklist },
    { ...h.step3, Mini: StepTrack },
  ]
  return (
    <section id="how" className="scroll-mt-20 py-20 sm:py-24">
      <Container>
        <SectionHead tag={h.tag} title={h.title} subtitle={h.subtitle} />
        <div className="grid gap-6 lg:grid-cols-3">
          {steps.map(({ label, title, body, Mini }, i) => (
            <MotionCard key={title} delay={i * 0.06} className="rounded-[26px] p-8">
              <div className="mb-4 inline-flex items-center gap-2.5 text-sm font-extrabold tracking-wide text-primary">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-primary-soft bg-white text-sm text-primary">
                  {i + 1}
                </span>
                {label}
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
              <p className="mt-2.5 text-[15px] font-medium text-muted-foreground">{body}</p>
              <div className="mt-6 border-t border-dashed border-border pt-5">
                <Mini />
              </div>
            </MotionCard>
          ))}
        </div>
      </Container>
    </section>
  )
}
