import { Check, Lock } from 'lucide-react'
import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'

export function Privacy({ dict }: { dict: Messages }) {
  const p = dict.landing.privacy
  const items = [p.item1, p.item2, p.item3]
  return (
    <section id="privacy" className="border-y border-border bg-secondary py-20 sm:py-24">
      <Container>
        <div className="relative grid items-center gap-10 overflow-hidden rounded-[26px] bg-gradient-to-br from-accent-strong to-[#16294C] p-10 text-white shadow-glow sm:p-12 lg:grid-cols-2 lg:gap-12">
          {/* soft red glow accent */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.4),transparent_65%)]" />
          <div className="relative">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{p.title}</h2>
            <p className="mt-3.5 text-base font-medium text-white/80">{p.body}</p>
          </div>
          <div className="relative grid gap-3.5">
            {items.map((item) => (
              <div key={item.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-white/15">
                  <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                </span>
                <div>
                  <div className="text-[15px] font-bold">{item.title}</div>
                  <div className="mt-0.5 text-sm font-medium text-white/70">{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
