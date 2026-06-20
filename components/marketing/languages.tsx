import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { MotionCard } from '@/components/motion/motion-card'
import { cn } from '@/lib/utils/cn'
import { SectionHead } from './section-head'

export function Languages({ dict }: { dict: Messages }) {
  const l = dict.landing.languages
  const cards = [
    { code: 'RU', tone: 'from-accent to-accent-strong', ...l.ru },
    { code: 'KK', tone: 'from-primary to-primary-strong', ...l.kk },
    { code: 'EN', tone: 'from-slate-600 to-slate-800', ...l.en },
  ]
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHead tag={l.tag} title={l.title} subtitle={l.subtitle} />
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
          {cards.map(({ code, tone, title, body }, i) => (
            <MotionCard key={code} delay={i * 0.06} className="p-7">
              <div
                className={cn(
                  'mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br text-[17px] font-extrabold text-white',
                  tone,
                )}
              >
                {code}
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
