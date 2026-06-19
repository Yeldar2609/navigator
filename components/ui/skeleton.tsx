import { cn } from '@/lib/utils/cn'

/** A calm shimmer placeholder for content that is loading. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden="true" />
}
