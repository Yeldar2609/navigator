import { Compass, ListChecks, TrendingUp, User } from 'lucide-react'
import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { MotionCard } from '@/components/motion/motion-card'
import { cn } from '@/lib/utils/cn'
import { SectionHead } from './section-head'

export function Features({ dict }: { dict: Messages }) {
  const f = dict.landing.features
  const cards = [
    { Icon: User, ...f.understand },
    { Icon: Compass, ...f.directions },
    { Icon: ListChecks, ...f.plan },
    { Icon: TrendingUp, ...f.progress },
  ]
  return (
    <section id="features" className="scroll-mt-20 border-y border-border bg-secondary py-20 sm:py-24">
      <Container>
        <SectionHead tag={f.tag} title={f.title} subtitle={f.subtitle} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ Icon, title, body }, i) => (
            <MotionCard key={title} delay={i * 0.06} className="p-7">
              <div
                className={cn(
                  'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white',
                  i % 2 === 0
                    ? 'from-primary to-primary-strong'
                    : 'from-accent to-accent-strong',
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm font-medium text-muted-foreground">{body}</p>
            </MotionCard>
          ))}
        </div>
      </Container>
    </section>
  )
}
