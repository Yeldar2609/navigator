import { Heart } from 'lucide-react'
import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { Badge } from '@/components/ui/badge'

export function Reassurance({ dict }: { dict: Messages }) {
  const r = dict.landing.reassurance
  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-gradient-to-br from-primary-soft to-card p-8 text-center sm:p-12">
          <div className="flex justify-center">
            <Badge variant="accent">
              <Heart className="h-3.5 w-3.5" />
              {r.chip}
            </Badge>
          </div>
          <h2 className="mt-5 text-2xl font-bold sm:text-3xl">{r.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{r.body}</p>
        </div>
      </Container>
    </section>
  )
}
