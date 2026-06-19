import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { MotionCard } from '@/components/motion/motion-card'

export function HowItWorks({ dict }: { dict: Messages }) {
  const h = dict.landing.how
  const steps = [h.step1, h.step2, h.step3, h.step4]
  return (
    <section id="how" className="scroll-mt-20 py-16 sm:py-20">
      <Container>
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{h.title}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <MotionCard key={i} delay={i * 0.06} className="p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </MotionCard>
          ))}
        </div>
      </Container>
    </section>
  )
}
