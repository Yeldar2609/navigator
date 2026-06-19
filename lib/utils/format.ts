/** Replace {placeholders} in a template string with values. */
export function interpolate(
  template: string,
  vars: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  )
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function pct(value: number): string {
  return `${Math.round(value)}%`
}

export function initials(name: string | null | undefined): string {
  if (!name) return 'N'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const out = parts.map((w) => w[0]?.toUpperCase() ?? '').join('')
  return out || 'N'
}
