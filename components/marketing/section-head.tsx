import { cn } from '@/lib/utils/cn'

/** Centered section header: uppercase red tag + bold H2 + muted subtitle. */
export function SectionHead({
  tag,
  title,
  subtitle,
  className,
}: {
  tag: string
  title: string
  subtitle: string
  className?: string
}) {
  return (
    <div className={cn('mx-auto mb-12 max-w-2xl text-center sm:mb-14', className)}>
      <div className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">{tag}</div>
      <h2 className="mt-3.5 text-3xl font-extrabold tracking-tight sm:text-[2.35rem]">{title}</h2>
      <p className="mt-4 text-lg font-medium text-muted-foreground">{subtitle}</p>
    </div>
  )
}
