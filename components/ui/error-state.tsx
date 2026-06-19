import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ErrorStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
      role="alert"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/12 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
