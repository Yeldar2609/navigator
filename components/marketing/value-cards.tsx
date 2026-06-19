import { Compass, Map, Search } from 'lucide-react'
import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { MotionCard } from '@/components/motion/motion-card'

export function ValueCards({ dict }: { dict: Messages }) {
  const v = dict.landing.values
  const cards = [
    { Icon: Compass, title: v.understand.title, body: v.understand.body },
    { Icon: Search, title: v.explore.title, body: v.explore.body },
    { Icon: Map, title: v.build.title, body: v.build.body },
  ]
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{v.title}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {cards.map(({ Icon, title, body }, i) => (
            <MotionCard key={i} delay={i * 0.08} className="p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </MotionCard>
          ))}
        </div>
      </Container>
    </section>
  )
}
