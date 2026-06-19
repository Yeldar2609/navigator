import { cn } from '@/lib/utils/cn'
import type { Route } from '@/lib/methodology/routes'

const ROUTE_DOT: Record<Route, string> = {
  technological: 'bg-[hsl(245_58%_58%)]',
  research: 'bg-[hsl(198_72%_45%)]',
  managerial: 'bg-[hsl(268_55%_60%)]',
  social_humanitarian: 'bg-[hsl(152_52%_42%)]',
  creative: 'bg-[hsl(18_92%_60%)]',
}

export interface RouteBadgeProps {
  route: Route
  label: string
  className?: string
}

export function RouteBadge({ route, label, className }: RouteBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-transform hover:-translate-y-0.5',
        className,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', ROUTE_DOT[route])} aria-hidden />
      {label}
    </span>
  )
}
