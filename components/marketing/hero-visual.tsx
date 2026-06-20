import type { Messages } from '@/lib/i18n/dictionaries'

/**
 * Decorative red + blue duotone "route motif" for the hero's right column.
 * Purely ornamental: aria-hidden and static (no motion), so it is safe under
 * reduced-motion. The two glass-card strings come from i18n.
 */
export function HeroVisual({ dict }: { dict: Messages }) {
  const v = dict.landing.hero.visual
  return (
    <div
      aria-hidden="true"
      className="relative aspect-square w-full overflow-hidden rounded-[26px] border border-border bg-[radial-gradient(120%_90%_at_80%_0%,hsl(var(--accent-soft))_0%,hsl(var(--secondary))_55%,#fff_100%)] shadow-glow"
    >
      {/* overlapping rounded blobs */}
      <div className="absolute left-[-8%] top-[8%] h-[62%] w-[62%] rounded-[48%_52%_55%_45%/52%_48%_52%_48%] bg-gradient-to-br from-accent to-accent-strong opacity-95" />
      <div className="absolute bottom-[-4%] right-[-6%] h-[54%] w-[54%] rounded-[54%_46%_48%_52%/46%_54%_46%_54%] bg-gradient-to-br from-primary to-primary-strong opacity-95 mix-blend-multiply" />
      <div className="absolute right-[14%] top-[10%] h-[40%] w-[40%] rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff_0%,#dce6ff_100%)] opacity-80" />

      {/* light diagonal accent bars */}
      <div className="absolute left-[-30%] top-[30%] h-11 w-[160%] -rotate-[22deg] rounded-full bg-white/55" />
      <div className="absolute left-[-30%] top-[62%] hidden h-[30px] w-[160%] -rotate-[22deg] rounded-full bg-white/30 sm:block" />

      {/* dashed route path (decorative inline SVG — no lucide equivalent) */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M18,24 C40,30 30,52 50,50 C72,48 64,78 84,80"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="0.5 5"
          opacity="0.85"
        />
      </svg>

      {/* 3 route nodes */}
      <div className="absolute left-[14%] top-[20%] flex h-11 w-11 items-center justify-center rounded-[14px] border border-border bg-white shadow-soft">
        <span className="h-3.5 w-3.5 rounded-full bg-accent" />
      </div>
      <div className="absolute left-1/2 top-[46%] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-[14px] border border-border bg-white shadow-soft">
        <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-accent to-primary" />
      </div>
      <div className="absolute bottom-[16%] right-[13%] flex h-11 w-11 items-center justify-center rounded-[14px] border border-border bg-white shadow-soft">
        <span className="h-3.5 w-3.5 rounded-full bg-primary" />
      </div>

      {/* frosted glass result card */}
      <div className="absolute bottom-[7%] left-1/2 flex w-[74%] -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-soft backdrop-blur">
        <span className="h-9 w-9 flex-none rounded-xl bg-gradient-to-br from-accent to-primary" />
        <div className="min-w-0">
          <b className="block truncate text-[13px] font-extrabold tracking-tight">{v.cardTitle}</b>
          <span className="block truncate text-[11px] text-muted-foreground">{v.cardSubtitle}</span>
        </div>
        <span className="ml-auto flex-none rounded-lg bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
          100%
        </span>
      </div>
    </div>
  )
}
