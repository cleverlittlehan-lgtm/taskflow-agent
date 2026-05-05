interface ConfidenceBadgeProps {
  value: number
  className?: string
}

function tier(value: number): { label: string; className: string } {
  const pct = Math.round(value * 100)
  if (pct >= 80)
    return {
      label: '高置信',
      className:
        'border-emerald-200 bg-emerald-50 text-emerald-800',
    }
  if (pct >= 60)
    return {
      label: '中置信',
      className: 'border-amber-200 bg-amber-50 text-amber-900',
    }
  return {
    label: '低置信',
    className: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  }
}

export function ConfidenceBadge({ value, className = '' }: ConfidenceBadgeProps) {
  const pct = Math.round(value * 100)
  const t = tier(value)
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${t.className}`}
      >
        {t.label}
      </span>
      <span className="text-xs font-semibold tabular-nums text-zinc-800">
        {pct}%
      </span>
    </div>
  )
}
