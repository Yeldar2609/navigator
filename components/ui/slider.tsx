'use client'

import { cn } from '@/lib/utils/cn'

export function Slider({
  value,
  min = 1,
  max = 5,
  onChange,
  lowLabel,
  highLabel,
  className,
  id,
  ariaLabel,
}: {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
  lowLabel?: string
  highLabel?: string
  className?: string
  id?: string
  ariaLabel?: string
}) {
  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const valueText =
    value <= min + 1 && lowLabel
      ? `${value} – ${lowLabel}`
      : value >= max - 1 && highLabel
        ? `${value} – ${highLabel}`
        : `${value}`
  return (
    <div className={cn('w-full', className)}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        aria-valuetext={valueText}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[hsl(var(--primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        {ticks.map((t) => (
          <span key={t} className={cn(t === value && 'font-bold text-primary')}>
            {t}
          </span>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  )
}
