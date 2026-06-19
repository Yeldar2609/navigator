import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function LoadingState({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  )
}
